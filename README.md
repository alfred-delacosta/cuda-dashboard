# CUDA Dashboard

LAN dashboard for NVIDIA GPU and CUDA status. It runs allowlisted `nvidia-smi` and `nvcc` commands on the machine that hosts the app, then shows a mobile-friendly UI. Raw output is one click away.

Copyright Advanced Software and AI Solutions LLC

**LAN only, no login; anyone on your network can view this.**

## Requirements

- Node.js already installed (use whatever version you have; do not pin or switch)
- NVIDIA GPU driver with `nvidia-smi` on Windows or WSL/Linux

## Install and run (Windows PowerShell)

```powershell
cd C:\repos\cuda-dashboard
npm install
npm run build
npm start
```

Open `http://localhost:3000` or `http://<APP_HOSTNAME>:3000` on your LAN.

Development (API with watch):

```powershell
npm run build:client
npm run dev
```

## WSL Ubuntu

```bash
cd /mnt/c/repos/cuda-dashboard
npm install
npm run build
npm start
```

On WSL the driver comes from the Windows host. `nvidia-smi` is often at `/usr/lib/wsl/lib/nvidia-smi`. `nvcc` exists only if a CUDA toolkit is installed inside WSL. Compute process lists are often empty.

For LAN reach from phones (mirrored networking or portproxy), see [docs/lan-access.md](docs/lan-access.md).

## Environment

Copy `.env.example` to `.env`. Loaded with `process.loadEnvFile` when present (existing process env wins).

| Key | Default | Notes |
|-----|---------|-------|
| PORT | 3000 | Listen port |
| HOST | 0.0.0.0 | Bind address for LAN |
| APP_HOSTNAME | `os.hostname()` | Shown in the UI header (not `HOSTNAME`) |
| ALLOWED_CIDRS | loopback + private ranges | Others get 403 |
| REFRESH_MS | 2000 | SSE sample interval (min 1000) |
| COMMAND_TIMEOUT_MS | 5000 | Per-command timeout |
| MAX_SSE_CLIENTS | 10 | Concurrent SSE clients |
| NVIDIA_SMI_PATH | unset | Absolute path override |
| NVCC_PATH | unset | Absolute path override |
| SHOW_PROCESS_NAMES | false | When true, basename only |
| SHOW_IDENTIFIERS | false | UUID/serial/board part redaction |

## LAN access (short)

1. Set `HOST=0.0.0.0` (default).
2. Add a Pi-hole local DNS record from your chosen name (for example `dell-aio.local`) to this machine's IP.
3. Allow `PORT` in Windows Firewall on the **Private** profile only. Do this yourself; this project never changes firewall rules.
4. Browse to `http://dell-aio.local:3000`. The header shows `APP_HOSTNAME:PORT`.

Full WSL networking notes: [docs/lan-access.md](docs/lan-access.md).

## Security and privacy

- Client IP must match `ALLOWED_CIDRS` or the response is 403.
- `Host` must be `APP_HOSTNAME`, the OS hostname, `localhost`, a loopback IP, or an address on this machine; otherwise 421 (DNS rebinding guard).
- API rate limit: 60 requests per minute per IP.
- CSP uses a per-request nonce (no `unsafe-inline` / `unsafe-eval`).
- Commands run only from a fixed allowlist via `execFile` with `shell: false`. No endpoint accepts a command, argument, or path.
- Identifiers and process names are hidden by default.

## CUDA note and recommendations

The CUDA version reported by `nvidia-smi` is the newest CUDA the **driver** supports. It is not the installed CUDA toolkit. The UI states this next to the value.

Toolkit detection (installed versions / active `nvcc`) is paired with a recommendation from `src/core/data/cuda-recommendations.json` (sources and `lastChecked` included in the API and UI). Update that file when NVIDIA ships new toolkit or driver branch mappings. This app never downloads or installs a toolkit for you.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/system` | Platform, hostname, smi source, driver |
| GET | `/api/gpus` | Parsed GPU metrics |
| GET | `/api/cuda` | Driver max CUDA, toolkit, explanation, recommendation |
| GET | `/api/processes` | Compute apps (privacy filtered) |
| GET | `/api/raw/:id` | Allowlisted raw output |
| GET | `/api/stream` | SSE `{ gpus, processes, at }` |

## Scripts

`npm run dev` · `build` · `start` · `lint` · `lint:copy` · `typecheck` · `test` · `check`
