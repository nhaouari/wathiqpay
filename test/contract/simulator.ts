/**
 * Local SATIM simulator for contract tests. Synthetic behavior only: it does
 * not claim to reproduce undocumented gateway behavior.
 */
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import * as fx from "../fixtures/synthetic/index.js";

export type HostedOutcome = "paid" | "declined" | "reversed" | "approved-one-phase" | "abandon" | "cancel";

export interface RecordedRequest {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  form: Record<string, string>;
}

export interface SimulatorOptions {
  username?: string;
  password?: string;
  /** Delay before responding, per path. */
  delayMs?: Partial<Record<string, number>>;
  /** Raw override responses, per path: string body, or { status, body }. */
  override?: Partial<Record<string, string | { status: number; body: string; headers?: Record<string, string> }>>;
}

export class Simulator {
  readonly requests: RecordedRequest[] = [];
  readonly orders = new Map<string, { orderNumber: string; amount: string; status: number; refunded: bigint; returnUrl: string; failUrl: string; respCode: string; description: string; actionCode?: number }>();
  private server: Server | undefined;
  private counter = 0;
  baseUrl = "";

  constructor(private readonly options: SimulatorOptions = {}) {}

  async start(): Promise<string> {
    this.server = createServer((req, res) => {
      void this.handle(req, res);
    });
    this.server.listen(0, "127.0.0.1");
    await once(this.server, "listening");
    const address = this.server.address();
    if (typeof address !== "object" || address === null) throw new Error("no address");
    this.baseUrl = `http://127.0.0.1:${address.port}/payment/rest`;
    return this.baseUrl;
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    this.server.closeAllConnections();
    await new Promise<void>((resolve, reject) => this.server!.close((e) => (e ? reject(e) : resolve())));
  }

  /** Mark an order as paid, as if the customer had completed the hosted page. */
  pay(orderId: string): void {
    this.decide(orderId, "paid");
  }

  /** Apply a hosted-page outcome and return the redirect target for the browser. */
  decide(orderId: string, outcome: HostedOutcome): string | undefined {
    const o = this.orders.get(orderId);
    if (!o) return undefined;
    const sep = (u: string) => (u.includes("?") ? "&" : "?");
    switch (outcome) {
      case "paid":
        o.status = 2;
        o.respCode = "00";
        return `${o.returnUrl}${sep(o.returnUrl)}orderId=${orderId}`;
      case "declined":
        o.status = 6;
        o.respCode = "51";
        o.description = "Solde insuffisant";
        return `${o.failUrl}${sep(o.failUrl)}orderId=${orderId}`;
      case "reversed":
        o.status = 3;
        return `${o.failUrl}${sep(o.failUrl)}orderId=${orderId}`;
      case "approved-one-phase":
        o.status = 1;
        return `${o.returnUrl}${sep(o.returnUrl)}orderId=${orderId}`;
      case "cancel":
        // Live-observed: customer clicks "Annuler" on SATIM's page.
        o.status = 6;
        o.respCode = "";
        o.description = "Operation cancelled by user";
        o.actionCode = 342034;
        return `${o.failUrl}${sep(o.failUrl)}orderId=${orderId}`;
      case "abandon":
        return undefined;
    }
  }

  /** Minimal hosted payment page: shows the amount and lets a tester pick an outcome. */
  private hosted(req: import("node:http").IncomingMessage, url: URL, text: string, res: import("node:http").ServerResponse): void {
    const [, , orderId, action] = url.pathname.split("/");
    const o = this.orders.get(orderId ?? "");
    if (!o) return send(res, 404, "unknown order");
    if (req.method === "POST" && action === "decide") {
      const outcome = (new URLSearchParams(text).get("outcome") ?? "abandon") as HostedOutcome;
      const target = this.decide(orderId!, outcome);
      if (!target) return send(res, 200, "<p>Browser closed. No redirect.</p>", { "content-type": "text/html" });
      res.writeHead(303, { location: target });
      res.end();
      return;
    }
    const amount = `${o.amount.slice(0, -2) || "0"}.${o.amount.slice(-2)} DZD`;
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Simulated SATIM page</title>
<style>body{margin:0;background:#EEF1F5;font-family:system-ui,sans-serif;color:#1c2431}.box{max-width:26rem;margin:4rem auto;background:#fff;border-radius:8px;padding:2rem;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h1{font-size:1.2rem;margin:0 0 .3rem}.warn{background:#FFF4D6;border:1px solid #F1D48A;border-radius:6px;padding:.6rem .8rem;font-size:.9rem;margin:1rem 0}
dl{display:grid;grid-template-columns:auto 1fr;gap:.3rem 1rem;font-size:.95rem}dt{color:#5b6470}dd{margin:0}.amt{font-size:1.6rem;font-weight:600;margin:.6rem 0 1.2rem}
button{display:block;width:100%;margin:.4rem 0;padding:.7rem;font:inherit;border-radius:6px;border:1px solid #cfd6e0;background:#fff;cursor:pointer;text-align:start}button.primary{background:#1B4F86;border-color:#1B4F86;color:#fff}</style></head>
<body><div class="box"><h1>Simulated SATIM page</h1><div class="warn">Local simulator, not SATIM. No card data is entered here.</div>
<dl><dt>Order</dt><dd>${o.orderNumber}</dd><dt>Amount</dt><dd class="amt">${amount}</dd></dl>
<form method="post" action="/hosted/${orderId}/decide">
<button class="primary" name="outcome" value="paid">Simulate accepted payment</button>
<button name="outcome" value="declined">Simulate declined card</button>
<button name="outcome" value="reversed">Simulate reversal</button>
<button name="outcome" value="approved-one-phase">Simulate undocumented status 1</button>
<button name="outcome" value="abandon">Simulate closed browser</button>
</form></div></body></html>`;
    send(res, 200, html, { "content-type": "text/html; charset=utf-8" });
  }

  private async handle(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname.startsWith("/hosted/")) return this.hosted(req, url, text, res);
    const path = url.pathname.replace(/^\/payment\/rest/, "");
    const form = Object.fromEntries(new URLSearchParams(text));
    this.requests.push({ path, method: req.method ?? "", headers: req.headers, form });

    const delay = this.options.delayMs?.[path];
    if (delay) await sleep(delay);

    const override = this.options.override?.[path];
    if (override !== undefined) {
      if (typeof override === "string") return send(res, 200, override);
      return send(res, override.status, override.body, override.headers);
    }
    if (req.method !== "POST") return json(res, 405, { errorCode: 5, errorMessage: "POST expected by simulator" });
    if (!req.headers["content-type"]?.startsWith("application/x-www-form-urlencoded")) {
      return json(res, 415, { errorCode: 5, errorMessage: "form encoding expected" });
    }
    const authOk = form["userName"] === (this.options.username ?? "user") && form["password"] === (this.options.password ?? "secret");
    if (!authOk) return json(res, 200, { errorCode: 5, errorMessage: "Access denied" });

    switch (path) {
      case "/register.do":
        return json(res, 200, this.register(form));
      case "/public/acknowledgeTransaction.do": {
        const out = this.acknowledge(form);
        if ("__status" in out) return send(res, out.__status as number, out.__body as string, { "content-type": "application/json" });
        return json(res, 200, out);
      }
      case "/refund.do":
        return json(res, 200, this.refund(form));
      default:
        return json(res, 404, { error: "not found" });
    }
  }

  private register(form: Record<string, string>): Record<string, unknown> {
    for (const f of ["orderNumber", "amount", "currency", "returnUrl", "failUrl", "language", "jsonParams"]) {
      if (!form[f]) return { errorCode: 4, errorMessage: `Missing ${f}` };
    }
    if (form["currency"] !== "012") return { errorCode: 3, errorMessage: "Unknown currency" };
    let jp: unknown;
    try {
      jp = JSON.parse(form["jsonParams"]!);
    } catch {
      return { errorCode: 5, errorMessage: "Invalid jsonParams" };
    }
    if (typeof jp !== "object" || jp === null || !(jp as Record<string, unknown>)["force_terminal_id"]) {
      return { errorCode: 5, errorMessage: "Missing force_terminal_id" };
    }
    for (const o of this.orders.values()) {
      if (o.orderNumber === form["orderNumber"]) return fx.registerDuplicate;
    }
    this.counter += 1;
    const orderId = `SIM${String(this.counter).padStart(6, "0")}`;
    this.orders.set(orderId, {
      orderNumber: form["orderNumber"]!,
      amount: form["amount"]!,
      status: 0,
      refunded: 0n,
      returnUrl: form["returnUrl"]!,
      failUrl: form["failUrl"]!,
      respCode: "",
      description: "",
    });
    return { errorCode: 0, orderId, formUrl: `${this.baseUrl.replace("/payment/rest", "")}/hosted/${orderId}` };
  }

  private acknowledge(form: Record<string, string>): Record<string, unknown> | { __status: number; __body: string } {
    const o = this.orders.get(form["mdOrder"] ?? "");
    // Live-observed: SATIM answers an unknown mdOrder with HTTP 401 and a JSON string.
    if (!o) return { __status: fx.ackUnknownOrderLive.status, __body: fx.ackUnknownOrderLive.bodyText };
    const base = { ErrorCode: "0", ErrorMessage: "Success", OrderStatus: o.status, OrderNumber: o.orderNumber, Amount: Number(o.amount), currency: "012" };
    if (o.status === 2) return { ...fx.ackPaid, ...base, depositAmount: Number(o.amount) };
    if (o.status === 4) return { ...fx.ackRefunded, ...base, depositAmount: Number(BigInt(o.amount) - o.refunded) };
    if (o.status === 1) return { ...fx.ackApprovedOnePhase, ...base };
    if (o.status === 3) return { ...fx.ackReversed, ...base };
    if (o.status === 6 || o.status === -1) {
      if (o.actionCode !== undefined) return { ...base, ErrorCode: "2", ErrorMessage: "Payment is declined", actionCode: o.actionCode, actionCodeDescription: o.description, params: {} };
      return { ...fx.ackDeclined, ...base, actionCodeDescription: o.description, params: { respCode: o.respCode, respCode_desc: o.description } };
    }
    return { ...base, actionCode: -100, actionCodeDescription: "", params: {} };
  }

  private refund(form: Record<string, string>): Record<string, unknown> {
    const o = this.orders.get(form["orderId"] ?? "");
    if (!o) return { errorCode: 6, errorMessage: "Unregistered order id" };
    if (o.status !== 2 && o.status !== 4) return fx.refundInvalidState;
    const amount = BigInt(form["amount"] ?? "0");
    if (amount <= 0n || o.refunded + amount > BigInt(o.amount)) return { errorCode: 5, errorMessage: "Invalid amount" };
    o.refunded += amount;
    o.status = 4; // live-observed: any refund moves the order to status 4
    if (o.refunded === BigInt(o.amount)) return fx.refundSuccess;
    return fx.refundSuccess;
  }
}

function json(res: import("node:http").ServerResponse, status: number, body: unknown): void {
  send(res, status, JSON.stringify(body), { "content-type": "application/json" });
}

function send(res: import("node:http").ServerResponse, status: number, body: string, headers: Record<string, string> = {}): void {
  res.writeHead(status, headers);
  res.end(body);
}
