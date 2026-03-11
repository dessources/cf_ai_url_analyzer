import { DurableObject } from "cloudflare:workers";
import {
  WorkflowMetadata,
  ScanResult,
  IntelligenceResponse,
  ScanSuccessResponse,
} from "@/types/workflow-types";

export interface AnalysisState {
  status: "idle" | "processing" | "completed" | "failed";
  currentStep: string;
  metadata?: WorkflowMetadata;
  scanSubmission?: ScanSuccessResponse;
  scanResult?: ScanResult;
  threatIntel?: IntelligenceResponse;
  finalAnalysis?: any;
  error?: string;
}

export class AnalysisStateDO extends DurableObject {
  /**
   * Updates the DO's internal state and persists it to storage.
   */
  async updateState(updates: Partial<AnalysisState>) {
    let state = (await this.ctx.storage.get<AnalysisState>("state")) || {
      status: "idle",
      currentStep: "Initializing...",
    };

    state = { ...state, ...updates };
    await this.ctx.storage.put("state", state);
    return state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // API for the Workflow to push updates
    if (url.pathname === "/update" && request.method === "POST") {
      const updates = (await request.json()) as Partial<AnalysisState>;
      const newState = await this.updateState(updates);
      return new Response(JSON.stringify(newState), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // API for the Frontend to poll progress
    if (url.pathname === "/get") {
      const state = (await this.ctx.storage.get<AnalysisState>("state")) || {
        status: "idle",
      };
      return new Response(JSON.stringify(state), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
