import validateURL from "@/lib/validateURL";
import { checkSuspiciousKeywords } from "@/lib/suspiciousKeywords";
import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";

import generateSecurityAnalysisPrompt from "@/lib/generateSecurityAnalysisPrompt";
import { URL_SCAN_MAX_ATTEMPTS } from "@/lib/utils";
import { NonRetryableError } from "cloudflare:workflows";
import {
  WorkflowEnv,
  WorkflowParams,
  WorkflowMetadata,
  ScanSuccessResponse,
  ScanResult,
  IntelligenceResponse,
} from "@/types/workflow-types";

export class URLAnalyzerWorkflow extends WorkflowEntrypoint<
  WorkflowEnv,
  WorkflowParams
> {
  async run(event: WorkflowEvent<WorkflowParams>, step: WorkflowStep) {
    const metadata = await step.do(
      "validate and extract metadata",
      async (): Promise<WorkflowMetadata> => {
        const url = event.payload.url;
        const isValid = validateURL(url);

        if (!isValid) {
          throw new Error(`Invalid URL provided: ${url}`);
        }

        const parsed = new URL(url);
        const matchedKeywords = checkSuspiciousKeywords(parsed.hostname);

        return {
          url,
          hostname: parsed.hostname,
          protocol: parsed.protocol,
          pathname: parsed.pathname,
          searchParams: parsed.search,
          matchedKeywords,
          isSuspicious: matchedKeywords.length > 0,
          timestamp: new Date().toISOString(),
        };
      },
    );

    const scanSubmission = await step.do(
      "submit scan",
      async (): Promise<ScanSuccessResponse> => {
        const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
        const api_token = process.env.URLScannerAPIAccessToken;
        let response: Response;

        response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${account_id}/urlscanner/v2/scan`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: event.payload.url,
            }),
          },
        );

        if (!response.ok) {
          if ([400, 401].includes(response.status)) {
            process.env.NODE_ENV != "production" && console.error(response);

            throw new NonRetryableError(
              "Bad request. Status code " + response.status,
            );
          }
          throw new Error("Scan submission failed: " + response.status);
        }

        const data: ScanSuccessResponse = await response.json();

        return data;
      },
    );

    if (!scanSubmission || !scanSubmission.api) {
      throw new Error("Failed to submit URL for scanning");
    }

    let scanResult: ScanResult | null = null;
    let attempts = 0;

    while (!scanResult && attempts < URL_SCAN_MAX_ATTEMPTS) {
      scanResult = await step.do(
        `check scan result attempt ${attempts + 1}`,
        async (): Promise<ScanResult | null> => {
          const api_token = process.env.URLScannerAPIAccessToken;
          const response = await fetch(scanSubmission.api, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${api_token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 200) {
            return (await response.json()) as ScanResult; // Done! Return the payload
          }

          if (response.status === 404) {
            return null; // Still scanning, return null to continue loop
          }

          throw new Error(
            `Unexpected status from URL Scanner API: ${response.status}`,
          );
        },
      );

      // 3. Sleep securely if it's not ready
      if (!scanResult) {
        attempts++;
        // Workflow hibernates here for 10 seconds, state is safely persisted
        await step.sleep(`wait for scan attempt ${attempts}`, "10 seconds");
      }
    }

    if (!scanResult) {
      throw new Error(
        `URL Scan timed out after ${URL_SCAN_MAX_ATTEMPTS * 10} seconds.`,
      );
    }

    const threatIntel = await step.do(
      "get threat intel",
      async (): Promise<IntelligenceResponse> => {
        const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
        const api_token = process.env.URLScannerAPIAccessToken;

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${account_id}/intel/domain?domain=${metadata.hostname}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${api_token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          if ([400, 401, 403, 404].includes(response.status)) {
            throw new NonRetryableError(
              `Intelligence API returned terminal error: ${response.status}`,
            );
          }
          throw new Error(`Intelligence API fetch failed: ${response.status}`);
        }

        const data: IntelligenceResponse = await response.json();
        return data;
      },
    );

    const finalAnalysis = await step.do(
      "analysis",
      async (): Promise<Ai_Cf_Meta_Llama_3_3_70B_Instruct_Fp8_Fast_Output> => {
        const prompt = generateSecurityAnalysisPrompt(
          metadata,
          scanResult!,
          threatIntel,
        );

        return await this.env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            prompt: prompt,
            max_tokens: 1000,
          },
        );
      },
    );

    // await step.do("send result", async () => {});
  }
}
