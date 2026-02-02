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

*Last updated: MVP architecture defined - Workflow + LLM analysis*
