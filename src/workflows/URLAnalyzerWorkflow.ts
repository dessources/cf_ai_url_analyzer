import {
  WorkflowEntrypoint,
  WorkflowEvent,
  WorkflowStep,
} from "cloudflare:workers";

type Env = {
  URL_ANALYZER_WORKFLOW: Workflow;
  AI: Ai;
  url: string;
};

type ScanSuccessResponse = {
  uuid: string;
  api: string;
  visibility: string;
  url: string;
  message: string;
};

type Params = {
  url: string;
};

export class URLAnalyzerWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<any>, step: WorkflowStep) {
    // const validate = await step.do("validate", async () => {});

    const metadata = await step.do("extract metadata", async () => {
      console.log(this.env);
      const account_id = process.env.CLOUDFLARE_ACCOUNT_ID;
      const api_token = process.env.URLScannerAPIAccessToken;

      try {
        const response = await fetch(
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

        if (!response.ok) throw new Error("Fetch to URL Scanner API failed.");

        const data: ScanSuccessResponse = await response.json();

        console.log(data);
      } catch (e: any) {
        process.env.NODE_ENV != "production" && console.error(e.message);
      }
    });

    // const scanData = await step.do("scan", async () => {});

    // const threatIntel = await step.do("get threat intel", async () => {});

    // const finalAnalysis = await step.do("analysis", async () => {
    //   return await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
    //     prompt: "Analyze this URL",
    //     max_tokens: 50,
    //   });
    // });

    // await step.do("send result", async () => {});
  }
}

/* 
Step A: Validate URL & extract metadata        │
│       │                                         │
│       ▼                                         │
│  Step B: Call Cloudflare URL Scanner API        │
│       │  (screenshot, technical report)         │
│       ▼                                         │
│  Step C: Gather reputation/threat intel         │
│       │  (Cloudflare Radar)                     │
│       ▼                                         │
│  Step D: Pass all data to Workers AI (Llama)   │
│       │  for final analysis                     │
│       ▼                                         │
│  Step E: Return verdict to user  

*/
