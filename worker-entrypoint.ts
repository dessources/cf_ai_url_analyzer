// custom-worker.ts

// @ts-ignore
// `.open-next/worker.ts` is generated at build time
import { default as handler } from "./.open-next/worker.js";

export { URLAnalyzerWorkflow } from "./src/workflows/URLAnalyzerWorkflow";

export default {
  fetch: handler.fetch,
} satisfies ExportedHandler<CloudflareEnv>;
