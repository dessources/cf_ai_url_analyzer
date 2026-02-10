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

**Status:** Pending implementation

**Input Data (fed to LLM):**
- URL being analyzed
- Domain metadata (age, registrar, SSL cert info)
- Redirect chain (if any)
- Page title and meta description
- Suspicious keyword matches
- URL Scanner results (screenshot analysis, detected technologies)
- Reputation data from threat intel sources

**Expected Output:**
- Risk level (Safe / Suspicious / Dangerous)
- Confidence score
- Human-readable explanation of WHY
- Specific indicators found
- Recommendation for user

**Template:**
```
[To be designed - v1 pending]
```

**Design Considerations:**
- Should explain reasoning, not just give verdict
- Needs to handle edge cases (URL Scanner fails, incomplete data)
- Should be specific about indicators (e.g., "lookalike domain for PayPal")
- Avoid false positives on legitimate shortened URLs

**Iterations:**
- v1: [Initial implementation - pending]

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

*Last updated: Merged v0 UI prompts into unified log*
