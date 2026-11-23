/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import fastifyStatic from "@fastify/static";
import rateLimit from "@fastify/rate-limit";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import type { AppConfig } from "../core/config.js";
import { isAllowlistId, getAllowlistEntry, allowlistIds } from "../core/allowlist.js";
import { createCidrBlockList, isIpAllowed } from "./security/cidr.js";
import { isHostAllowed, collectInterfaceIps } from "./security/host.js";
import { buildCspHeader, createNonce } from "./security/csp.js";
import { NvidiaService, DRIVER_CUDA_EXPLANATION } from "./services/nvidia.js";
import { SharedSampler } from "./sampler.js";
import { logRequest } from "./log.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface AppContext {
  config: AppConfig;
  service: NvidiaService;
  sampler: SharedSampler;
}

function sendError(reply: FastifyReply, status: number, code: string, message: string) {
  return reply.status(status).send({ error: { code, message } });
}

export async function buildApp(config: AppConfig): Promise<{
  app: FastifyInstance;
  ctx: AppContext;
}> {
  const service = new NvidiaService(config);
  const sampler = new SharedSampler(service, config.refreshMs);
  const ctx: AppContext = { config, service, sampler };

  const app = Fastify({
    logger: false,
    trustProxy: false,
  });

  const blockList = createCidrBlockList(config.allowedCidrs);
  const interfaceIps = collectInterfaceIps();
  const osHostname = os.hostname();

  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Too many requests",
      code: "rate_limited",
      ttl: context.ttl,
    }),
  });

  app.addHook("onRequest", async (request, reply) => {
    (request as FastifyRequest & { _startedAt?: number })._startedAt = Date.now();

    const ip = request.ip || "";
    if (!isIpAllowed(blockList, ip)) {
      return sendError(reply, 403, "forbidden_ip", "Client IP is not allowed");
    }

    const hostOk = isHostAllowed(
      request.headers.host,
      config.appHostname,
      osHostname,
      interfaceIps,
    );
    if (!hostOk) {
      return sendError(reply, 421, "misdirected_host", "Host header is not allowed");
    }

    const nonce = createNonce();
    (request as FastifyRequest & { cspNonce?: string }).cspNonce = nonce;
    reply.header("Content-Security-Policy", buildCspHeader(nonce));
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "no-referrer");
    reply.header("X-Frame-Options", "DENY");
  });

  app.addHook("onResponse", async (request, reply) => {
    const started = (request as FastifyRequest & { _startedAt?: number })._startedAt ?? Date.now();
    logRequest(request.method, request.url, reply.statusCode, Date.now() - started);
  });

  app.get("/api/health", async () => ({ ok: true }));

  app.get("/api/system", async () => {
    const meta = await service.getDriverMeta();
    return {
      platform: service.platform,
      appHostname: config.appHostname,
      port: config.port,
      smi: {
        found: service.smi.found,
        source: service.smi.source,
      },
      driverVersion: meta.driverVersion,
      driverMaxCuda: meta.driverMaxCuda,
    };
  });

  app.get("/api/gpus", async () => {
    const gpus = await service.getGpus();
    return { gpus };
  });

  app.get("/api/cuda", async () => {
    const meta = await service.getDriverMeta();
    const toolkit = await service.getToolkit();
    return {
      driverMaxCuda: meta.driverMaxCuda,
      toolkit,
      explanation: DRIVER_CUDA_EXPLANATION,
    };
  });

  app.get("/api/processes", async () => {
    const processes = await service.getProcesses();
    return processes;
  });

  app.get<{ Params: { id: string } }>("/api/raw/:id", async (request, reply) => {
    const { id } = request.params;
    if (!isAllowlistId(id)) {
      return sendError(reply, 404, "not_found", "Unknown command id");
    }
    const entry = getAllowlistEntry(id)!;
    const { result, output } = await service.getRaw(id);
    return {
      id,
      label: entry.label,
      displayCommand: entry.displayCommand,
      output,
      exitCode: result.exitCode,
      durationMs: result.durationMs,
      status: result.status,
      message: result.message,
    };
  });

  app.get("/api/raw", async () => ({ ids: allowlistIds() }));

  app.get("/api/stream", async (request, reply) => {
    if (sampler.clientCount >= config.maxSseClients) {
      return sendError(reply, 503, "sse_full", "Too many SSE clients");
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Security-Policy": buildCspHeader(
        (request as FastifyRequest & { cspNonce?: string }).cspNonce ?? createNonce(),
      ),
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
    });

    const write = (payload: unknown) => {
      reply.raw.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    const unsubscribe = sampler.subscribe((payload) => {
      write(payload);
    });

    const keepAlive = setInterval(() => {
      reply.raw.write(": keepalive\n\n");
    }, 15000);
    if (typeof keepAlive === "object" && "unref" in keepAlive) keepAlive.unref();

    request.raw.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
    });
  });

  const clientDist = path.resolve(__dirname, "../client");
  const indexPath = path.join(clientDist, "index.html");

  if (existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: "/",
      wildcard: false,
    });

    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith("/api/")) {
        return sendError(reply, 404, "not_found", "Not found");
      }
      if (!existsSync(indexPath)) {
        return sendError(reply, 404, "not_found", "UI not built");
      }
      const nonce = (request as FastifyRequest & { cspNonce?: string }).cspNonce ?? createNonce();
      let html = readFileSync(indexPath, "utf8");
      html = html.replace(/__CSP_NONCE__/g, nonce);
      // Ensure script/link tags that Vite emits can carry nonce for stricter CSP.
      html = html.replace(/<script(?![^>]*nonce=)/gi, `<script nonce="${nonce}"`);
      html = html.replace(/<link(?![^>]*nonce=)/gi, `<link nonce="${nonce}"`);
      return reply.type("text/html").send(html);
    });
  } else {
    app.get("/", async (_request, reply) => {
      return reply
        .type("text/html")
        .send(
          "<!doctype html><html><body><p>Build the client with npm run build, then restart.</p></body></html>",
        );
    });
  }

  return { app, ctx };
}
