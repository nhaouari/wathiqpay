/**
 * Vercel serverless entry for the reference merchant. vercel.json rewrites
 * every path here; product images are served statically from the output
 * directory. The app is created once per warm instance.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp, type MerchantApp } from "../examples/reference-merchant/src/app.js";
import { configFromEnv } from "../examples/reference-merchant/src/config.js";

let appPromise: Promise<MerchantApp> | undefined;

function app(): Promise<MerchantApp> {
  appPromise ??= createApp(configFromEnv());
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const a = await app();
    await a.handle(req, res);
  } catch (e) {
    appPromise = undefined; // let the next request retry initialisation
    if (!res.headersSent) res.writeHead(500, { "content-type": "text/plain" });
    res.end(`merchant unavailable: ${e instanceof Error ? e.message : "error"}`);
  }
}
