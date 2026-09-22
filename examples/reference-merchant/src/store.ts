/**
 * Order persistence on libSQL (SQLite-compatible). One implementation runs
 * everywhere: `file:` paths for the local demo and Docker, `:memory:` for
 * tests, and a hosted Turso database (libsql:// + auth token) on Vercel.
 *
 * The schema enforces the two invariants the certification checklist cares
 * about: order numbers are unique, and fulfilment happens at most once
 * (guarded by a conditional UPDATE whose rowsAffected decides the winner).
 */
import { createClient, type Client, type InStatement, type Row } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export type OrderState = "pending" | "registered" | "paid" | "declined" | "reversed" | "refunded" | "partially_refunded" | "unknown" | "review" | "failed";

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  unitMinor: string;
  quantity: number;
}

export interface OrderRow {
  orderNumber: string;
  sessionId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerEmail: string | null;
  satimOrderId: string | null;
  amountMinor: string;
  currency: "DZD";
  description: string;
  language: "FR" | "AR" | "EN";
  state: OrderState;
  createdAt: string;
  registeredAt: string | null;
  acknowledgedAt: string | null;
  fulfilledAt: string | null;
  fulfilmentCount: number;
  ackJson: string | null;
  note: string | null;
}

export interface StoreConfig {
  /** ":memory:", "file:./data/merchant.sqlite", or "libsql://<db>.turso.io". */
  url: string;
  authToken?: string | undefined;
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 unambiguous symbols

/** 10-character alphanumeric reference: "W" + 9 random symbols (32^9 ≈ 3.5e13). */
export function generateOrderNumber(): string {
  const bytes = randomBytes(9);
  let out = "W";
  for (let i = 0; i < 9; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS orders (
    order_number     TEXT PRIMARY KEY,
    satim_order_id   TEXT UNIQUE,
    amount_minor     TEXT NOT NULL,
    currency         TEXT NOT NULL,
    description      TEXT NOT NULL,
    language         TEXT NOT NULL,
    state            TEXT NOT NULL,
    created_at       TEXT NOT NULL,
    registered_at    TEXT,
    acknowledged_at  TEXT,
    fulfilled_at     TEXT,
    fulfilment_count INTEGER NOT NULL DEFAULT 0,
    ack_json         TEXT,
    note             TEXT,
    session_id       TEXT,
    customer_email   TEXT,
    customer_name    TEXT,
    customer_phone   TEXT,
    customer_address TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS cart_lines (
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity   INTEGER NOT NULL,
    PRIMARY KEY (session_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    order_number TEXT NOT NULL REFERENCES orders(order_number),
    product_id   TEXT NOT NULL,
    name         TEXT NOT NULL,
    unit_minor   TEXT NOT NULL,
    quantity     INTEGER NOT NULL,
    PRIMARY KEY (order_number, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS fulfilments (
    order_number TEXT PRIMARY KEY REFERENCES orders(order_number),
    fulfilled_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS orders_session ON orders(session_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS orders_state ON orders(state, registered_at)`,
];

export class OrderStore {
  private constructor(private readonly db: Client) {}

  static async open(config: StoreConfig): Promise<OrderStore> {
    if (config.url.startsWith("file:")) mkdirSync(dirname(config.url.slice(5)), { recursive: true });
    const db = createClient({ url: config.url, ...(config.authToken ? { authToken: config.authToken } : {}) });
    for (const sql of SCHEMA) await db.execute(sql);
    return new OrderStore(db);
  }

  private async run(sql: string, args: Array<string | number | null> = []): Promise<number> {
    return (await this.db.execute({ sql, args })).rowsAffected;
  }
  private async one(sql: string, args: Array<string | number | null> = []): Promise<Row | undefined> {
    return (await this.db.execute({ sql, args })).rows[0];
  }
  private async many(sql: string, args: Array<string | number | null> = []): Promise<Row[]> {
    return (await this.db.execute({ sql, args })).rows;
  }

  // ---- cart -------------------------------------------------------------

  async getCart(sessionId: string): Promise<CartLine[]> {
    const rows = await this.many(`SELECT product_id, quantity FROM cart_lines WHERE session_id = ? ORDER BY rowid`, [sessionId]);
    return rows.map((r) => ({ productId: String(r["product_id"]), quantity: Number(r["quantity"]) }));
  }

  async setCartLine(sessionId: string, productId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.run(`DELETE FROM cart_lines WHERE session_id = ? AND product_id = ?`, [sessionId, productId]);
      return;
    }
    await this.run(
      `INSERT INTO cart_lines (session_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(session_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
      [sessionId, productId, quantity],
    );
  }

  async addToCart(sessionId: string, productId: string, quantity: number): Promise<void> {
    await this.run(
      `INSERT INTO cart_lines (session_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(session_id, product_id) DO UPDATE SET quantity = MIN(99, quantity + excluded.quantity)`,
      [sessionId, productId, quantity],
    );
  }

  async clearCart(sessionId: string): Promise<void> {
    await this.run(`DELETE FROM cart_lines WHERE session_id = ?`, [sessionId]);
  }

  // ---- orders -----------------------------------------------------------

  /** Insert a pending order and its items atomically, retrying on the (astronomically unlikely) reference collision. */
  async createPending(input: {
    amountMinor: string;
    description: string;
    language: OrderRow["language"];
    sessionId?: string;
    customerName?: string | null;
    customerPhone?: string | null;
    customerAddress?: string | null;
    customerEmail?: string | null;
    items?: OrderItem[];
  }): Promise<OrderRow> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = generateOrderNumber();
      const statements: InStatement[] = [
        {
          sql: `INSERT INTO orders (order_number, amount_minor, currency, description, language, state, created_at, session_id, customer_email, customer_name, customer_phone, customer_address)
                VALUES (?, ?, 'DZD', ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
          args: [orderNumber, input.amountMinor, input.description, input.language, now(), input.sessionId ?? null, input.customerEmail ?? null, input.customerName ?? null, input.customerPhone ?? null, input.customerAddress ?? null],
        },
        ...(input.items ?? []).map((it) => ({
          sql: `INSERT INTO order_items (order_number, product_id, name, unit_minor, quantity) VALUES (?, ?, ?, ?, ?)`,
          args: [orderNumber, it.productId, it.name, it.unitMinor, it.quantity],
        })),
      ];
      try {
        await this.db.batch(statements, "write");
        return (await this.get(orderNumber))!;
      } catch (e) {
        if (!/UNIQUE constraint failed: orders\.order_number/.test(String(e))) throw e;
      }
    }
    throw new Error("could not allocate a unique order number");
  }

  async markRegistered(orderNumber: string, satimOrderId: string): Promise<void> {
    await this.run(`UPDATE orders SET satim_order_id = ?, state = 'registered', registered_at = ? WHERE order_number = ? AND state = 'pending'`, [satimOrderId, now(), orderNumber]);
  }

  async markFailed(orderNumber: string, note: string): Promise<void> {
    await this.run(`UPDATE orders SET state = 'failed', note = ? WHERE order_number = ? AND state = 'pending'`, [note, orderNumber]);
  }

  async recordAcknowledgement(orderNumber: string, state: OrderState, ackJson: string, note: string | null = null): Promise<void> {
    await this.run(`UPDATE orders SET state = ?, acknowledged_at = ?, ack_json = ?, note = ? WHERE order_number = ?`, [state, now(), ackJson, note, orderNumber]);
  }

  /**
   * Fulfil exactly once. Returns true only for the call that performed the
   * fulfilment; concurrent or repeated calls return false. A single
   * conditional UPDATE is atomic on the database, so no transaction is needed.
   */
  async fulfilOnce(orderNumber: string, ackJson: string): Promise<boolean> {
    const at = now();
    const changes = await this.run(
      `UPDATE orders SET state = 'paid', acknowledged_at = ?, ack_json = ?, fulfilled_at = ?, fulfilment_count = fulfilment_count + 1
       WHERE order_number = ? AND fulfilled_at IS NULL`,
      [at, ackJson, at, orderNumber],
    );
    if (changes !== 1) return false;
    await this.run(`INSERT INTO fulfilments (order_number, fulfilled_at) VALUES (?, ?)`, [orderNumber, at]);
    return true;
  }

  async get(orderNumber: string): Promise<OrderRow | undefined> {
    const row = await this.one(`SELECT * FROM orders WHERE order_number = ?`, [orderNumber]);
    return row ? toRow(row) : undefined;
  }

  async items(orderNumber: string): Promise<OrderItem[]> {
    const rows = await this.many(`SELECT product_id, name, unit_minor, quantity FROM order_items WHERE order_number = ? ORDER BY rowid`, [orderNumber]);
    return rows.map((r) => ({ productId: String(r["product_id"]), name: String(r["name"]), unitMinor: String(r["unit_minor"]), quantity: Number(r["quantity"]) }));
  }

  async ordersForSession(sessionId: string): Promise<OrderRow[]> {
    return (await this.many(`SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC LIMIT 50`, [sessionId])).map(toRow);
  }

  async getBySatimOrderId(satimOrderId: string): Promise<OrderRow | undefined> {
    const row = await this.one(`SELECT * FROM orders WHERE satim_order_id = ?`, [satimOrderId]);
    return row ? toRow(row) : undefined;
  }

  /** Orders registered with SATIM whose customer never came back. */
  async staleRegistered(olderThanSeconds: number): Promise<OrderRow[]> {
    const cutoff = new Date(Date.now() - olderThanSeconds * 1000).toISOString();
    return (await this.many(`SELECT * FROM orders WHERE state IN ('registered', 'unknown') AND registered_at <= ? ORDER BY registered_at LIMIT 200`, [cutoff])).map(toRow);
  }

  async fulfilmentCount(orderNumber: string): Promise<number> {
    const row = await this.one(`SELECT COUNT(*) AS n FROM fulfilments WHERE order_number = ?`, [orderNumber]);
    return Number(row?.["n"] ?? 0);
  }

  close(): void {
    this.db.close();
  }
}

function now(): string {
  return new Date().toISOString();
}

function text(v: unknown): string | null {
  return v === null || v === undefined ? null : String(v);
}

function toRow(r: Row): OrderRow {
  return {
    orderNumber: String(r["order_number"]),
    sessionId: text(r["session_id"]),
    customerName: text(r["customer_name"]),
    customerPhone: text(r["customer_phone"]),
    customerAddress: text(r["customer_address"]),
    customerEmail: text(r["customer_email"]),
    satimOrderId: text(r["satim_order_id"]),
    amountMinor: String(r["amount_minor"]),
    currency: "DZD",
    description: String(r["description"]),
    language: String(r["language"]) as OrderRow["language"],
    state: String(r["state"]) as OrderState,
    createdAt: String(r["created_at"]),
    registeredAt: text(r["registered_at"]),
    acknowledgedAt: text(r["acknowledged_at"]),
    fulfilledAt: text(r["fulfilled_at"]),
    fulfilmentCount: Number(r["fulfilment_count"]),
    ackJson: text(r["ack_json"]),
    note: text(r["note"]),
  };
}
