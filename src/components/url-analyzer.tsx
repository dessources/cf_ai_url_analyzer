'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

export default function UrlAnalyzer() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI analysis - replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock result
    const mockResult = `URL Analysis Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Target URL: ${url}

Security Assessment:
✓ HTTPS protocol detected
✓ Valid SSL certificate
✓ No known malicious patterns

Domain Information:
• Domain age: 5 years
• Registrar: Example Registrar Inc.
• Last updated: 30 days ago

Content Analysis:
• Page load time: 1.2s
• Mobile-friendly: Yes
• Content type: Web Application

AI Risk Score: Low (2/10)
Recommendation: Safe to proceed

This analysis was powered by Cloudflare AI`;

    setResult(mockResult);
    setIsAnalyzing(false);
  };

  return (
    <div className="w-full max-w-[800px]">
      <div className="bg-card rounded-lg border border-border shadow-2xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-card-foreground">AI URL Analyzer</h1>
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
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="p-6 min-h-[300px]">
          {!isAnalyzing && !result && (
            <div className="flex items-center justify-center h-[268px] text-muted-foreground">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
                  <Globe className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-lg">Analysis will appear here</p>
                <p className="text-sm mt-2">Enter a URL above and click Analyze to begin</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center justify-center h-[268px]">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-lg text-foreground font-medium">AI Analysis in Progress</p>
                  <div className="flex items-center justify-center gap-1 dot-typing">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyzing security, content, and domain information
                  </p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-muted/20 rounded-md p-5 border border-border/50">
              <pre className="font-mono text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">
                {result}
              </pre>
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
