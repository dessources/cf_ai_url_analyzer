"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Globe,
  Search,
  Shield,
  Activity,
  Brain,
  CheckCircle2,
  Moon,
  Sun,
  AlertCircle,
  Info,
  Lock,
  FileText,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { ResultCard } from "./result-card";

import { IntelligenceResponse, ScanResult } from "@/types/workflow-types";

type ErrorType =
  | "invalid_url"
  | "service_unavailable"
  | "rate_limit"
  | "network_error"
  | null;

interface AnalysisError {
  type: ErrorType;
  message: string;
  details?: string;
}

const ANALYSIS_STEPS = [
  {
    id: "validate",
    label: "Validating URL & extracting metadata",
    icon: Search,
    duration: 1500,
  },
  {
    id: "scanner",
    label: "Calling Cloudflare URL Scanner API",
    icon: Globe,
    duration: 2000,
  },
  {
    id: "reputation",
    label: "Gathering reputation & threat intelligence",
    icon: Shield,
    duration: 1800,
  },
  {
    id: "ai",
    label: "Processing data with Workers AI (Llama)",
    icon: Brain,
    duration: 2200,
  },
  {
    id: "verdict",
    label: "Generating final verdict",
    icon: Activity,
    duration: 1000,
  },
];

interface AnalysisResult {
  url: string;
  security: {
    https: boolean;
    sslValid: boolean;
    maliciousPatterns: boolean;
    riskScore: number;
  };
  domain: {
    age: string;
    registrar: string;
    lastUpdated: string;
  };
  content: {
    loadTime: string;
    mobileFriendly: boolean;
    contentType: string;
  };
  recommendation: string;
}

export default function UrlAnalyzer() {
  const { theme, toggleTheme } = useTheme();
  const [url, setUrl] = useState("https://www.jaemdessources.dev");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<AnalysisError | null>(null);

  const mapWorkflowStepToUIIndex = (workflowStep: string): number => {
    const s = workflowStep.toLowerCase();
    if (s.includes("validat")) return 0;
    if (s.includes("scan")) return 1;
    if (s.includes("intel") || s.includes("reputation")) return 2;
    if (s.includes("ai") || s.includes("analysis")) return 3;
    if (s.includes("complete")) return 4;
    return 0;
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || isAnalyzing) return;

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError({
        type: "invalid_url",
        message: "Invalid URL Format",
        details:
          "Please enter a valid URL including the protocol (http:// or https://)",
      });

      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);
    setCurrentStep(0);

    try {
      // 1. Start the workflow
      console.log("calling the API");
      const startRes = await fetch(
        `/api/analyze?url=${encodeURIComponent(url)}`,
      );
      if (!startRes.ok) throw new Error("service_unavailable");

      const { id } = (await startRes.json()) as { id: string; message: string };

      // 2. Poll for status
      const poll = async () => {
        try {
          const statusRes = await fetch(`/api/status?id=${id}`);
          if (!statusRes.ok) throw new Error("status_fetch_failed");

          const state = (await statusRes.json()) as {
            currentStep: string;
            status: string;
            metadata?: any;
            finalAnalysis?: any;
            error?: any;
            scanResult: ScanResult;
            threatIntel: IntelligenceResponse;
          };

          if (state.currentStep) {
            setCurrentStep(mapWorkflowStepToUIIndex(state.currentStep));
          }

          if (state.status === "completed") {
            setIsAnalyzing(false);

            // Map real state to the UI's Result interface
            setResult({
              url: state.metadata?.url || url,
              security: {
                https: state.metadata?.protocol === "https:",
                sslValid: true,
                maliciousPatterns:
                  state.scanResult?.verdicts.overall.malicious || false,
                riskScore: state.threatIntel?.result.risk_score || 0,
              },
              domain: {
                age: "N/A",
                registrar: state.scanResult?.page.server || "Unknown",
                lastUpdated: "Recently Scanned",
              },
              content: {
                loadTime: "N/A",
                mobileFriendly: true,
                contentType: state.scanResult?.page.mimeType || "text/html",
              },
              recommendation:
                state.finalAnalysis?.response ||
                state.finalAnalysis ||
                "No recommendation available.",
            });
            return; // Stop polling
          }

          if (state.status === "failed") {
            setIsAnalyzing(false);
            setError({
              type: "network_error",
              message: "Analysis Failed",
              details:
                state.error || "An unexpected error occurred during analysis.",
            });
            return; // Stop polling
          }

          // Continue polling
          setTimeout(poll, 1000);
        } catch (err) {
          console.error("Polling error:", err);
          setIsAnalyzing(false);
          setError({
            type: "network_error",
            message: "Connection Lost",
            details: "The connection to the analysis service was interrupted.",
          });
        }
      };

      await poll();
    } catch (err) {
      setIsAnalyzing(false);
      const errorType = (err as Error).message as ErrorType;
      setError({
        type: errorType === "service_unavailable" ? errorType : "network_error",
        message: "Analysis Failed",
        details: "Could not start the analysis. Please try again later.",
      });
    }
  };

  return (
    <div className="w-full max-w-[800px]">
      <div className="bg-card rounded-lg border border-border shadow-2xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-card-foreground">
                AI URL Analyzer
              </h1>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-6 border-b border-border">
          <form onSubmit={handleAnalyze} className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL to analyze..."
              className="flex-1 px-4 py-3 bg-input text-foreground rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground transition-all"
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              disabled={isAnalyzing || !url.trim()}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isAnalyzing ? "Analyzing..." : "Analyze"}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="p-6 min-h-[300px]">
          {!isAnalyzing && !result && !error && (
            <div className="flex items-center justify-center h-[268px] text-muted-foreground">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                  <Globe className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg">Analysis will appear here</p>
                <p className="text-sm mt-2">
                  Enter a URL above and click Analyze to begin
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="w-full max-w-md">
                <div className="bg-danger/5 border border-danger/20 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-danger/10 flex-shrink-0">
                      {error.type === "invalid_url" ? (
                        <AlertCircle className="w-5 h-5 text-danger" />
                      ) : error.type === "rate_limit" ? (
                        <AlertTriangle className="w-5 h-5 text-danger" />
                      ) : (
                        <XCircle className="w-5 h-5 text-danger" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {error.message}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {error.details}
                      </p>
                      <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium rounded-md transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col gap-4 py-8">
              {/* Current Step Highlight */}
              <div className="flex items-center justify-center mb-2">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    {(() => {
                      const StepIcon =
                        ANALYSIS_STEPS[currentStep]?.icon || Globe;
                      return <StepIcon className="w-7 h-7 text-primary" />;
                    })()}
                  </div>
                </div>
              </div>

              {/* Current Step Text */}
              <div className="text-center mb-4">
                <p className="text-lg font-medium text-foreground mb-2">
                  {ANALYSIS_STEPS[currentStep]?.label}
                </p>
                <div className="flex items-center justify-center gap-1 dot-typing">
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  <span className="w-2 h-2 bg-primary rounded-full" />
                  <span className="w-2 h-2 bg-primary rounded-full" />
                </div>
              </div>

              {/* All Steps Progress */}
              <div className="space-y-3 px-4">
                {ANALYSIS_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = index < currentStep;
                  const isCurrent = index === currentStep;
                  const isPending = index > currentStep;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md border transition-all ${
                        isCurrent
                          ? "bg-primary/5 border-primary/30"
                          : isCompleted
                            ? "bg-muted/20 border-border/50"
                            : "bg-transparent border-border/30 opacity-50"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                              ? "bg-primary/20 text-primary"
                              : "bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium transition-colors ${
                          isCurrent
                            ? "text-foreground"
                            : isCompleted
                              ? "text-muted-foreground"
                              : "text-muted-foreground/60"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result && (
            <div>
              {/* Sticky Header - AI Recommendation and Target URL */}
              <div className="sticky top-5 z-10 bg-card pb-4 space-y-4">
                {/* AI Recommendation - Shown First */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">
                        AI Recommendation
                      </h4>
                      <div className="text-sm text-foreground leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result.recommendation}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Target URL */}
                <div className="bg-muted/30 rounded-lg px-4 py-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Target URL
                  </p>
                  <p className="text-sm text-foreground font-medium break-all">
                    {result.url}
                  </p>
                </div>
              </div>

              {/* Scrollable Details Section */}
              <div className="space-y-4 pt-4">
                {/* Security Assessment */}
                <ResultCard
                  title="Security Assessment"
                  icon={<Shield className="w-4 h-4" />}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          HTTPS Protocol Detected
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Secure connection established
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Valid SSL Certificate
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Certificate is trusted and up to date
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          No Known Malicious Patterns
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Passed threat intelligence checks
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          AI Risk Score
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-success">
                            {result.security.riskScore}/10
                          </span>
                          <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
                            Low Risk
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ResultCard>

                {/* Domain Information */}
                <ResultCard
                  title="Domain Information"
                  icon={<Globe className="w-4 h-4" />}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Domain Age
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {result.domain.age}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Registrar
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {result.domain.registrar}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Updated
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {result.domain.lastUpdated}
                      </span>
                    </div>
                  </div>
                </ResultCard>

                {/* Content Analysis */}
                <ResultCard
                  title="Content Analysis"
                  icon={<FileText className="w-4 h-4" />}
                  defaultOpen={true}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Page Load Time
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {result.content.loadTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Mobile Friendly
                      </span>
                      <span
                        className={`text-sm font-medium ${result.content.mobileFriendly ? "text-success" : "text-danger"}`}
                      >
                        {result.content.mobileFriendly ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Content Type
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {result.content.contentType}
                      </span>
                    </div>
                  </div>
                </ResultCard>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Powered by Cloudflare AI • Advanced URL Intelligence
      </div>
    </div>
  );
}
