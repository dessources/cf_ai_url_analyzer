import {
  WorkflowMetadata,
  ScanResult,
  IntelligenceResponse,
} from "@/types/workflow-types";

export default function generateSecurityAnalysisPrompt(
  metadata: WorkflowMetadata,
  scanResult: ScanResult,
  threatIntel: IntelligenceResponse,
): string {
  const verdict = scanResult.verdicts.overall;
  const categories = verdict.categories.join(", ") || "None";
  const matchedKeywords = metadata.matchedKeywords.join(", ") || "None";

  const intel = threatIntel.result;
  const contentCategoriesArr =
    (intel.content_categories ?? intel.inherited_content_categories) || [];
  const contentCategories =
    contentCategoriesArr.map((c) => c.name).join(", ") || "None";

  const maliciousCategories =
    (intel.malicious_categories || []).map((c) => c.name).join(", ") || "None";

  return `
You are a Cloudflare Security Analyst. Analyze the following data for a URL and provide a security assessment.

### TARGET URL
- URL: ${metadata.url}
- Hostname: ${metadata.hostname} 
- Protocol: ${metadata.protocol}

### STEP A: METADATA & HEURISTICS
- Suspicious Keywords Found: ${matchedKeywords}
- Is Suspicious (Heuristic): ${metadata.isSuspicious}

### STEP B: LIVE SCAN RESULTS (URL Scanner API)
- Malicious Verdict: ${verdict.malicious}
- Scan Categories: ${categories}
- Page Title: ${scanResult.page?.title || "N/A"}
- Server: ${scanResult.page?.server || "N/A"}
- Status Code: ${scanResult.page?.status || "N/A"}
- IP: ${scanResult.page?.ip} (${scanResult.page?.country}, ${scanResult.page?.asn})

### STEP C: REPUTATION & THREAT INTEL (Cloudflare Intelligence)
- Reputation Risk Score (0-100): ${intel.risk_score}
- Popularity Rank: ${intel.popularity_rank}
- Content Categories: ${contentCategories}
- Known Malicious Categories: ${maliciousCategories}

### YOUR TASK
Based on the data above, provide a concise security assessment (1-4 sentences) explaining the verdict and reasoning. Focus only on the explanation of "why" you reached your conclusion.

Provide your response as a single, human-readable paragraph. Do not include labels, headers, risk levels, or scores in your output.
`;
}
