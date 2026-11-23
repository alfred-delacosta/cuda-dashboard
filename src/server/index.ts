/**
 * Copyright Advanced Software and AI Solutions LLC
 */
import { loadConfig, loadEnvFileIfPresent } from "../core/config.js";
import { buildApp } from "./app.js";

loadEnvFileIfPresent();
const config = loadConfig();

const { app } = await buildApp(config);

try {
  await app.listen({ port: config.port, host: config.host });
  console.info(
    JSON.stringify({
      event: "listen",
      host: config.host,
      port: config.port,
      appHostname: config.appHostname,
    }),
  );
} catch (err) {
  console.error(err);
  process.exit(1);
}
