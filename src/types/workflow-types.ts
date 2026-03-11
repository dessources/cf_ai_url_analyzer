export interface WorkflowParams {
  url: string;
}

export interface WorkflowMetadata {
  url: string;
  hostname: string;
  protocol: string;
  pathname: string;
  searchParams: string;
  matchedKeywords: string[];
  isSuspicious: boolean;
  timestamp: string;
}

export interface ScanSuccessResponse {
  uuid: string;
  api: string;
  visibility: string;
  url: string;
  message: string;
}

export interface ScanResult {
  page: {
    apexDomain: string;
    asn: string;
    asnname: string;
    city: string;
    country: string;
    domain: string;
    ip: string;
    mimeType: string;
    server: string;
    status: string;
    title: string;
    tlsAgeDays: number;
    tlsIssuer: string;
    tlsValidDays: number;
    tlsValidFrom: string;
    url: string;

    screenshot: {
      dhash: string;
      mm3Hash: number;
      name: string;
      phash: string;
    };
  };
  task: {
    apexDomain: string;
    domain: string;
    domURL: string;
    method: string;

    reportURL: string;
    screenshotURL: string;
    source: string;
    success: boolean;
    time: string;
    url: string;
    uuid: string;
    visibility: string;
  };
  verdicts: {
    overall: {
      categories: Array<string>;
      hasVerdicts: boolean;
      malicious: boolean;
      tags: Array<string>;
    };
  };
  stats: {
    requests: number;
    dataLength: number;
    uniqIPs: number;
  };
}

export interface IntelligenceResponse {
  result: {
    domain: string;
    popularity_rank: number;
    application?: {
      id: string;
      name: string;
    };
    content_categories: {
      id: number;
      name: string;
      super_category_id: number;
    }[];
    risk_score: number;
    malicious_categories: {
      id: number;
      name: string;
      super_category_id: number;
    }[];
    inherited_content_categories?: any[];
    inherited_risk_score?: number;
    inherited_malicious_categories?: any[];
  };
  success: boolean;
  errors: any[];
  messages: any[];
}

export interface WorkflowEnv {
  URL_ANALYZER_WORKFLOW: Workflow;
  AI: Ai;
  ANALYSIS_STATE_DO: DurableObjectNamespace<import("../durable-objects/AnalysisStateDO").AnalysisStateDO>;
}
