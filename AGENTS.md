# AGENTS

Phase 1 CUDA dashboard: allowlisted NVIDIA CLI only, LAN dashboard, detect toolkit (no recommendation).

## Hard rules

- Node as installed. No engines, .nvmrc, or Node version pins. Never downgrade Node.
- No Docker, compose, or container docs.
- Spawn only via execFile (shell false), fixed allowlist argument arrays, timeout, maxBuffer 2 MB, windowsHide.
- No endpoint accepts a command, argument, or path. No write, reset, or settings flags.
- Prefer CSV and XML over scraping. [N/A] and [Not Supported] become null / "Not available".
- nvidia-smi "CUDA Version" is driver max CUDA, not installed toolkit. UI must say so in plain words.
- Security: ALLOWED_CIDRS (403), Host allowlist (421), rate limit 60/min/IP, CSP with per-request nonce (no unsafe-inline or unsafe-eval).
- Privacy: SHOW_IDENTIFIERS and SHOW_PROCESS_NAMES default false. Never commit secrets, serials, UUIDs, or personal paths.
- No em or en dashes in copy or docs (lint:copy).
- Copyright Advanced Software and AI Solutions LLC in headers, footer, and README.
- Phase 2 only after Phase 1 is confirmed: toolkit recommendation data and lan-access docs.

## Stack

Node, TypeScript, Fastify (+ static, rate-limit), fast-xml-parser, Vite, React, MUI, Emotion, Vitest.
Ask before adding any other dependency.
