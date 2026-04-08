# PROMPTS.md - AI Prompts Documentation

## Overview

This document tracks all AI prompts used in the cf-ai-url-analyzer project, including iterations and design decisions.

**Model:** Cloudflare Workers AI - Llama 3.3 70B Instruct (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`)

**LLM Role:** The LLM acts as a "Security Analyst" - it receives URL metadata and scan data, then provides human-readable risk assessments explaining the "why" behind its verdict.

---

## Architecture (MVP)

```
User submits URL
       │
       ▼
┌─────────────────────────────────────────────────┐
│              Cloudflare Workflow                │
│                                                 │
│  Step A: Validate URL & extract metadata        │
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
│  Step E: Return verdict to user                 │
└─────────────────────────────────────────────────┘
```

---

## Prompts

### 1. URL Security Analysis Prompt

**Purpose:** Analyze aggregated URL data and provide a human-readable security assessment with reasoning.

**Status:** Implemented (v2)

**Input Data (fed to LLM):**
- **Target URL**: The original submitted URL and its components.
- **Metadata**: Suspicious keyword matches and heuristic suspicious flags.
- **Scanner Results**: Live scan data (Malicious verdict, status code, IP info, categories).
- **Reputation Data**: Cloudflare Intelligence data (Risk score, popularity, content categories).

**Expected Output:**
- A single concise paragraph (1-4 sentences) explaining the verdict and reasoning.

**Template (v2):**
```markdown
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
- Page Title: ${scanResult.page.title || "N/A"}
- Server: ${scanResult.page.server || "N/A"}
- Status Code: ${scanResult.page.status || "N/A"}
- IP: ${scanResult.page.ip} (${scanResult.page.country}, ${scanResult.page.asn})

### STEP C: REPUTATION & THREAT INTEL (Cloudflare Intelligence)
- Reputation Risk Score (0-100): ${intel.risk_score}
- Popularity Rank: ${intel.popularity_rank}
- Content Categories: ${contentCategories}
- Known Malicious Categories: ${maliciousCategories}

### YOUR TASK
Based on the data above, provide a concise security assessment (1-4 sentences) explaining the verdict and reasoning. Focus only on the explanation of "why" you reached your conclusion.

Provide your response as a single, human-readable paragraph. Do not include labels, headers, risk levels, or scores in your output.
```

**Design Considerations:**
- Consolidates live telemetry (Scanner) with historical reputation (Intelligence).
- v2 prioritizes human-readable natural language over structured fields for better UX.
- Includes heuristic indicators (keywords) to catch brand spoofing (e.g., "paypal").

**Iterations:**
- v1: Initial implementation focusing on data synthesis and human-readable assessment with structured output (Risk Level, Confidence, etc.).
- v2: Simplified to a single paragraph (1-4 sentences) to provide a more natural and direct security assessment.

---

## Prompt Engineering Notes

### Design Decisions
- **Analyst persona**: LLM acts as security analyst to provide explanatory assessments
- **Chain of data**: Raw data gathered first, then synthesized by LLM (not LLM doing the fetching)
- **MVP focus**: Workflow + LLM analysis first, real-time updates and session memory in later phases

### Patterns to Explore
- Structured output (JSON) vs natural language response
- Chain-of-thought for complex phishing detection reasoning
- Few-shot examples of known phishing patterns

### Open Questions
- How to handle when URL Scanner API is unavailable?
- What's the minimum data needed for a useful assessment?
- Should we ask LLM to output structured JSON or natural text?

---

## UI Development Prompts (v0)

The following prompts were used during UI development with v0 to build the frontend interface.

### v0 Prompt 1: Initial Project Setup

**Purpose:** Establish the base UI with Cloudflare-inspired design.

**Prompt:**
```
[Pasted project requirements document]
```

**Implemented:**
- Cloudflare dashboard aesthetic with dark theme UI
- Vibrant orange (#f38020) accent color
- Card-based layout centered at 800px max-width
- Background #1d1d1d, card background #2a2a2a

---

### v0 Prompt 2: Add Thinking Animations

**Purpose:** Show real-time workflow progress to the user during analysis.

**Prompt:**
```
include "thinking" animations where the UI shows what the background ai-model is doing currently.
there should be a text next to some "ai loading" animation.

here is the tentative workflow i'm using:
│
│  Step A: Validate URL & extract metadata        │
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
```

**Implemented:**
- Progressive step visualization showing 5 workflow stages
- Animated spinning icon with contextual icons for each step (Search, Globe, Shield, Brain, Activity)
- Real-time status text updates
- Step progress tracker with completed/current/pending states
- Checkmark icons for completed steps

---

### v0 Prompt 3: Theme Switching & UI Improvements

**Purpose:** Add light/dark theme support and improve results display.

**Prompt:**
```
include light/dark theme switching feature.
Use some nice but appropriate fonts instead of the current Arial/Helvetica
the result component's text should not be in "mono" font. it should be normal font,
divided into foldable cards by information type. i.e. security assessment in one card,
then below it domain information, then content analysis etc. they should all be unfolded
when the analysis completes but the user should be able to fold them if needed
```

**Implemented:**
- Light/dark theme toggle with sun/moon icon in header
- Theme persistence using localStorage
- Replaced Arial/Helvetica with Geist Sans font
- Collapsible result cards for Security Assessment, Domain Information, and Content Analysis
- Cards start expanded but can be collapsed by user
- Normal font rendering instead of monospace

---

### v0 Prompt 4: Reorder Results Display

**Purpose:** Prioritize AI recommendation visibility.

**Prompt:**
```
The "AI Recommendation" component should place before the "target Url" card and all the details
so that user can see recommendation immediately instead of going through all the technical details first.
```

**Implemented:**
- Moved AI Recommendation to the top of results
- Order now: AI Recommendation → Target URL → Security Assessment → Domain Information → Content Analysis
- Users see the verdict immediately upon analysis completion

---

### v0 Prompt 5: Error States & Sticky Headers

**Purpose:** Add error handling and improve UX with sticky positioning.

**Prompt:**
```
add error state for errors that might happen (invalid url, service unavailable, rate limit etc.)
also, when the user scrolls down to see the details, the "AI recomendation" component and Target URL card
should remain visible while the deails scroll past under them
```

**Implemented:**
- Comprehensive error handling for:
  - Invalid URL format
  - Service unavailable
  - Rate limit exceeded
  - Network connection errors
- Error display with contextual icons (AlertCircle, AlertTriangle, XCircle)
- Clear error messages with actionable details
- Dismissible error state
- Sticky positioning for AI Recommendation and Target URL sections
- Technical details scroll underneath while verdict stays visible

---

### v0 Prompt 6: Create Prompt History

**Purpose:** Document all UI development prompts.

**Prompt:**
```
add all the prompts that I gave in this chat to a "v0.prompts.md" file so I can see prompt history
```

**Implemented:**
- Created v0.prompts.md documenting all prompts and implementations (now merged into this file)

---

---

## Session: Prompt Refinement & Markdown Integration

The following prompts were used during this session to refine the AI output and improve markdown rendering in the UI.

### Session Prompt 1: Markdown Integration

**Purpose:** Enable markdown rendering for AI recommendations.

**Prompt:**
```
replace the p tag on line 425 of src/components/url-analyzer.tsx by a next-mdx-remote component that takes result.recommendation as the markdown prop
```

**Implemented:**
- Replaced standard `<p>` tag with `MDXRemote` from `next-mdx-remote/rsc`.
- Added `remark-gfm` support.
- Wrapped in `prose prose-invert` for consistent styling.

---

### Session Prompt 2: Switch to ReactMarkdown

**Purpose:** Resolve RSC/Client Component conflicts by switching to a more flexible client-side markdown library.

**Prompt:**
```
replace next-mdx-remote by react-markdown
```

**Implemented:**
- Switched from `next-mdx-remote` to `react-markdown`.
- Maintained `remark-gfm` for advanced markdown features.
- Ensured seamless client-side rendering within the existing UI.

---

### Session Prompt 3: AI Assessment Prompt Refinement (v2)

**Purpose:** Simplify AI output to a natural language paragraph focusing exclusively on reasoning.

**Prompt:**
```
the current prompt in src/lib/generateSecurityAnalysisPrompt.ts does not specify a detailed response format for the AI. I should be 1-4 sentences like so:
"The URL appears to be a personal website for a systems engineer, with no suspicious keywords or malicious verdicts found during the scan. The server is hosted on Vercel, a reputable platform, and the IP address is located in the United States. The lack of any known malicious categories or suspicious activity suggests that the website is legitimate."

So only the reasoning is needed as the output of the prompt
```

**Implemented:**
- Updated `generateSecurityAnalysisPrompt.ts` to request a concise 1-4 sentence reasoning paragraph.
- Removed structured fields (Risk Level, Score, etc.) from the LLM task to prioritize human-readable assessment.
- Documented as v2 in the main prompts section.

---

*Last updated: Added Session: Prompt Refinement & Markdown Integration section*
