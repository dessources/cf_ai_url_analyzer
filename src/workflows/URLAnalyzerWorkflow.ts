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
    // 0. Get the Durable Object instance for this workflow run
    const doId = this.env.ANALYSIS_STATE_DO.idFromName(this.id);
    const stateDO = this.env.ANALYSIS_STATE_DO.get(doId);

    const updateState = async (updates: any) => {
      await stateDO.fetch("http://do/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    };

    // Step A: Metadata extraction
    const metadata = await step.do(
      "validate and extract metadata",
      async (): Promise<WorkflowMetadata> => {
        await updateState({
          status: "processing",
          currentStep: "Validating URL...",
        });

        const url = event.payload.url;
        const isValid = validateURL(url);

        if (!isValid) {
          throw new Error(`Invalid URL provided: ${url}`);
        }

        const parsed = new URL(url);
        const matchedKeywords = checkSuspiciousKeywords(parsed.hostname);

        const data = {
          url,
          hostname: parsed.hostname,
          protocol: parsed.protocol,
          pathname: parsed.pathname,
          searchParams: parsed.search,
          matchedKeywords,
          isSuspicious: matchedKeywords.length > 0,
          timestamp: new Date().toISOString(),
        };

        await updateState({ metadata: data, currentStep: "URL Validated" });
        return data;
      },
    );

    // Step B: Submit scan
    const scanSubmission = await step.do(
      "submit scan",
      async (): Promise<ScanSuccessResponse> => {
        await updateState({ currentStep: "Submitting to URL Scanner..." });

        const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
        const api_token = process.env.URLScannerAPIAccessToken;

        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${account_id}/urlscanner/v2/scan`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${api_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: event.payload.url }),
          },
        );

        if (!response.ok) {
          if ([400, 401].includes(response.status)) {
            throw new NonRetryableError(
              "Bad request. Status code " + response.status,
            );
          }
          throw new Error("Scan submission failed: " + response.status);
        }

        const data: ScanSuccessResponse = await response.json();
        await updateState({
          scanSubmission: data,
          currentStep: "Scan Submitted",
        });
        return data;
      },
    );

    // Step B.2: Poll for scan results
    let scanResult: ScanResult | null = null;
    let attempts = 0;

    while (!scanResult && attempts < URL_SCAN_MAX_ATTEMPTS) {
      scanResult = await step.do(
        `check scan result attempt ${attempts + 1}`,
        async (): Promise<ScanResult | null> => {
          await updateState({
            currentStep: `Scanning URL (Attempt ${attempts + 1})...`,
          });

          const api_token = process.env.URLScannerAPIAccessToken;
          const response = await fetch(scanSubmission.api, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${api_token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 200) {
            const data = (await response.json()) as ScanResult;
            await updateState({
              scanResult: data,
              currentStep: "Scan Result Received",
            });
            return data;
          }

          if (response.status === 404) {
            return null;
          }

          throw new Error(
            `Unexpected status from URL Scanner API: ${response.status}`,
          );
        },
      );

      if (!scanResult) {
        attempts++;
        await step.sleep(`wait for scan attempt ${attempts}`, "10 seconds");
      }
    }

    if (!scanResult) {
      const error = `URL Scan timed out after ${URL_SCAN_MAX_ATTEMPTS * 10} seconds.`;
      await updateState({ status: "failed", error });
      throw new Error(error);
    }

    // Step C: Threat Intel
    const threatIntel = await step.do(
      "get threat intel",
      async (): Promise<IntelligenceResponse> => {
        await updateState({ currentStep: "Fetching Threat Intelligence..." });

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
              `Intelligence API terminal error: ${response.status}`,
            );
          }
          throw new Error(`Intelligence API fetch failed: ${response.status}`);
        }

        const data: IntelligenceResponse = await response.json();
        await updateState({
          threatIntel: data,
          currentStep: "Threat Intel Received",
        });
        return data;
      },
    );

    // Step D: AI Analysis
    const finalAnalysis = await step.do(
      "analysis",
      async (): Promise<AiTextGenerationOutput> => {
        await updateState({ currentStep: "Performing final AI analysis..." });

        const prompt = generateSecurityAnalysisPrompt(
          metadata,
          scanResult!,
          threatIntel,
        );

        const result = await this.env.AI.run(
          "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
          {
            prompt: prompt,
            max_tokens: 1000,
          },
        );

        await updateState({
          finalAnalysis: result,
          status: "completed",
          currentStep: "Analysis Complete",
        });
        //@ts-ignore
        return result;
      },
    );
  }
}
