import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { Simulator } from "../../../test/contract/simulator.js";

test("the Vercel entry serves the shop from environment configuration and accepts a pre-parsed body", async () => {
  const sim = new Simulator();
  const baseUrl = await sim.start();
  Object.assign(process.env, { MERCHANT_MODE: "simulator", MERCHANT_DB_URL: ":memory:", SATIM_BASE_URL: baseUrl, MERCHANT_OUTBOX: "/dev/null", MERCHANT_PUBLIC_URL: "https://demo.example" });
  const { default: handler } = await import("../../../api/merchant.js");
  const server = createServer((req, res) => {
    // Mimic Vercel: body already parsed into an object for form posts.
    if (req.method === "POST") {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => {
        (req as typeof req & { body: unknown }).body = Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()));
        void handler(req, res);
      });
    } else void handler(req, res);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = (server.address() as { port: number }).port;
  const origin = `http://127.0.0.1:${port}`;
  try {
    const health = await fetch(`${origin}/healthz`);
    assert.deepEqual(await health.json(), { ok: true, mode: "simulator" });
    const home = await fetch(`${origin}/`);
    assert.equal(home.status, 200);
    assert.match(home.headers.get("set-cookie") ?? "", /Secure/, "cookies are Secure behind https");
    const sid = /sid=([a-f0-9]+)/.exec(home.headers.get("set-cookie") ?? "")![1];
    const add = await fetch(`${origin}/cart/add`, { method: "POST", redirect: "manual", headers: { cookie: `sid=${sid}`, "content-type": "application/x-www-form-urlencoded" }, body: "product=dates&quantity=2" });
    assert.equal(add.status, 303);
    const cart = await fetch(`${origin}/cart`, { headers: { cookie: `sid=${sid}` } });
    assert.match(await cart.text(), /2 400,00 DZD/);
  } finally {
    server.closeAllConnections();
    server.close();
    await sim.stop();
  }
});
