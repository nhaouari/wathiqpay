/**
 * Local SATIM simulator for contract tests. Synthetic behavior only: it does
 * not claim to reproduce undocumented gateway behavior.
 */
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import * as fx from "../fixtures/synthetic/index.js";

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
  readonly orders = new Map<string, { orderNumber: string; amount: string; status: number; refunded: bigint }>();
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
    const o = this.orders.get(orderId);
    if (o) o.status = 2;
  }

  private async handle(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const text = Buffer.concat(chunks).toString("utf8");
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
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
      case "/public/acknowledgeTransaction.do":
        return json(res, 200, this.acknowledge(form));
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
    this.orders.set(orderId, { orderNumber: form["orderNumber"]!, amount: form["amount"]!, status: 0, refunded: 0n });
    return { errorCode: 0, orderId, formUrl: `${this.baseUrl.replace("/payment/rest", "")}/hosted/${orderId}` };
  }

  private acknowledge(form: Record<string, string>): Record<string, unknown> {
    const o = this.orders.get(form["mdOrder"] ?? "");
    if (!o) return fx.ackUnknownOrder;
    const base = { ErrorCode: "0", ErrorMessage: "Success", OrderStatus: o.status, OrderNumber: o.orderNumber, Amount: Number(o.amount), currency: "012" };
    if (o.status === 2) return { ...fx.ackPaid, ...base, depositAmount: Number(o.amount) };
    if (o.status === 4) return { ...fx.ackRefunded, ...base };
    return { ...base, actionCode: -100, actionCodeDescription: "", params: {} };
  }

  private refund(form: Record<string, string>): Record<string, unknown> {
    const o = this.orders.get(form["orderId"] ?? "");
    if (!o) return { errorCode: 6, errorMessage: "Unregistered order id" };
    if (o.status !== 2 && o.status !== 4) return fx.refundInvalidState;
    const amount = BigInt(form["amount"] ?? "0");
    if (amount <= 0n || o.refunded + amount > BigInt(o.amount)) return { errorCode: 5, errorMessage: "Invalid amount" };
    o.refunded += amount;
    if (o.refunded === BigInt(o.amount)) o.status = 4;
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
