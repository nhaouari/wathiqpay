/**
 * Entry point: `npm run demo`. In simulator mode it also starts the local
 * SATIM simulator so the whole journey runs offline.
 */
import { loadDotEnv, configFromEnv } from "./config.js";
import { createApp } from "./app.js";
import { Simulator } from "../../../test/contract/simulator.js";

loadDotEnv();
const config = configFromEnv();

let simulator: Simulator | undefined;
if (config.mode === "simulator") {
  simulator = new Simulator();
  config.satim.baseUrl = await simulator.start();
  console.log(`simulator: ${config.satim.baseUrl}`);
}
if (config.mode !== "simulator" && !config.publicUrl.startsWith("https://")) {
  console.error("MERCHANT_PUBLIC_URL must be an https:// origin reachable by the customer's browser in certification/production mode.");
  process.exit(1);
}

const app = createApp(config);
const origin = await app.start(config.port);
console.log(`merchant:   ${origin}  (mode=${config.mode}, public URL ${config.publicUrl})`);
console.log(`outbox:     ${config.outboxDir}`);
console.log(`mailer:     ${config.smtpUrl ? "smtp" : "outbox"}`);
console.log(`reconcile:  curl -X POST ${origin}/admin/reconcile${config.adminToken ? " -H 'Authorization: Bearer $MERCHANT_ADMIN_TOKEN'" : ""}`);
// Closed-browser recovery runs on a timer as well as on demand.
setInterval(() => {
  app.reconcile().then((r) => { if (r.length) console.log(`reconciled ${r.length} order(s)`); }).catch((e) => console.error("reconcile failed", e));
}, 60_000).unref();

const shutdown = async () => {
  await app.stop();
  await simulator?.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
