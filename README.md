# SQLite3 Fuzzing Dashboard

A React + TypeScript dashboard for planning and presenting a fuzzing campaign against SQLite3. You configure a run (strategy, duration, targets), then watch a live view of coverage, executions and crashes, and finish with a report that shows each crash's severity, AddressSanitizer summary, stack trace and a reproducible SQL test case.

Built as a companion to my SWEN90006 (Security & Software Testing, University of Melbourne) assignment, in which our team fuzz-tested SQLite with mutation-based, generation-based and coverage-guided fuzzing.

> **Note: the results are simulated.** This app does not run SQLite or a fuzzer. It asks Google Gemini to generate a plausible campaign (coverage curve, execution counts, crashes) from your configuration, so you can prototype the reporting UI. None of the crashes shown are real SQLite bugs.

## Stack

- React 19, TypeScript, Vite
- Recharts for the coverage and execution charts
- Google Gemini (`@google/genai`) with a JSON response schema for the simulated run

## Run locally

Prerequisite: Node.js.

1. Install dependencies: `npm install`
2. Put your Gemini API key in `.env.local` as `GEMINI_API_KEY=...`
3. Start the dev server: `npm run dev`

## Layout

| Path | What it is |
| --- | --- |
| `components/SetupForm.tsx` | Campaign configuration form |
| `components/Dashboard.tsx` | Live view of coverage, executions and crashes |
| `components/ReportView.tsx` | Final report with per-crash detail |
| `services/geminiService.ts` | Generates the simulated campaign through Gemini |
| `types.ts` | Shared types for config, crashes and reports |
