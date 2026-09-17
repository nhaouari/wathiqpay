/**
 * Order persistence on node:sqlite. The schema enforces the two invariants
 * the certification checklist cares about: order numbers are unique, and
 * fulfilment happens at most once (guarded by a conditional UPDATE).
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

export type OrderState = "pending" | "registered" | "paid" | "declined" | "reversed" | "refunded" | "unknown" | "review" | "failed";

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

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 unambiguous symbols

/** 10-character alphanumeric reference: "W" + 9 random symbols (32^9 ≈ 3.5e13). */
export function generateOrderNumber(): string {
  const bytes = randomBytes(9);
  let out = "W";
  for (let i = 0; i < 9; i += 1) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export class OrderStore {
  private readonly db: DatabaseSync;

  constructor(path: string) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS orders (
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
        note             TEXT
      );
      CREATE TABLE IF NOT EXISTS cart_lines (
        session_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        quantity   INTEGER NOT NULL,
        PRIMARY KEY (session_id, product_id)
      );
      CREATE TABLE IF NOT EXISTS order_items (
        order_number TEXT NOT NULL REFERENCES orders(order_number),
        product_id   TEXT NOT NULL,
        name         TEXT NOT NULL,
        unit_minor   TEXT NOT NULL,
        quantity     INTEGER NOT NULL,
        PRIMARY KEY (order_number, product_id)
      );
      CREATE TABLE IF NOT EXISTS fulfilments (
        order_number TEXT PRIMARY KEY REFERENCES orders(order_number),
        fulfilled_at TEXT NOT NULL
      );
    `);
    // Additive migration for databases created by the single-item demo.
    const cols = (this.db.prepare(`PRAGMA table_info(orders)`).all() as Array<{ name: string }>).map((c) => c.name);
    if (!cols.includes("session_id")) this.db.exec(`ALTER TABLE orders ADD COLUMN session_id TEXT`);
    if (!cols.includes("customer_email")) this.db.exec(`ALTER TABLE orders ADD COLUMN customer_email TEXT`);
  }

  // ---- cart -------------------------------------------------------------

  getCart(sessionId: string): CartLine[] {
    const rows = this.db.prepare(`SELECT product_id, quantity FROM cart_lines WHERE session_id = ? ORDER BY rowid`).all(sessionId) as Array<Record<string, unknown>>;
    return rows.map((r) => ({ productId: r["product_id"] as string, quantity: Number(r["quantity"]) }));
  }

  setCartLine(sessionId: string, productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.db.prepare(`DELETE FROM cart_lines WHERE session_id = ? AND product_id = ?`).run(sessionId, productId);
      return;
    }
    this.db
      .prepare(`INSERT INTO cart_lines (session_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(session_id, product_id) DO UPDATE SET quantity = excluded.quantity`)
      .run(sessionId, productId, quantity);
  }

  addToCart(sessionId: string, productId: string, quantity: number): void {
    this.db
      .prepare(`INSERT INTO cart_lines (session_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(session_id, product_id) DO UPDATE SET quantity = MIN(99, quantity + excluded.quantity)`)
      .run(sessionId, productId, quantity);
  }

  clearCart(sessionId: string): void {
    this.db.prepare(`DELETE FROM cart_lines WHERE session_id = ?`).run(sessionId);
  }

  // ---- orders -----------------------------------------------------------

  /** Insert a pending order, retrying on the (astronomically unlikely) reference collision. */
  createPending(input: {
    amountMinor: string;
    description: string;
    language: OrderRow["language"];
    sessionId?: string;
    customerEmail?: string | null;
    items?: OrderItem[];
  }): OrderRow {
    const stmt = this.db.prepare(
      `INSERT INTO orders (order_number, amount_minor, currency, description, language, state, created_at, session_id, customer_email)
       VALUES (?, ?, 'DZD', ?, ?, 'pending', ?, ?, ?)`,
    );
    const itemStmt = this.db.prepare(`INSERT INTO order_items (order_number, product_id, name, unit_minor, quantity) VALUES (?, ?, ?, ?, ?)`);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = generateOrderNumber();
      try {
        this.db.exec("BEGIN IMMEDIATE");
        try {
          stmt.run(orderNumber, input.amountMinor, input.description, input.language, now(), input.sessionId ?? null, input.customerEmail ?? null);
          for (const it of input.items ?? []) itemStmt.run(orderNumber, it.productId, it.name, it.unitMinor, it.quantity);
          this.db.exec("COMMIT");
        } catch (e) {
          this.db.exec("ROLLBACK");
          throw e;
        }
        return this.get(orderNumber)!;
      } catch (e) {
        if (!/UNIQUE constraint failed/.test(String(e))) throw e;
      }
    }
    throw new Error("could not allocate a unique order number");
  }

  markRegistered(orderNumber: string, satimOrderId: string): void {
    this.db
      .prepare(`UPDATE orders SET satim_order_id = ?, state = 'registered', registered_at = ? WHERE order_number = ? AND state = 'pending'`)
      .run(satimOrderId, now(), orderNumber);
  }

  markFailed(orderNumber: string, note: string): void {
    this.db.prepare(`UPDATE orders SET state = 'failed', note = ? WHERE order_number = ? AND state = 'pending'`).run(note, orderNumber);
  }

  recordAcknowledgement(orderNumber: string, state: OrderState, ackJson: string, note: string | null = null): void {
    this.db
      .prepare(`UPDATE orders SET state = ?, acknowledged_at = ?, ack_json = ?, note = ? WHERE order_number = ?`)
      .run(state, now(), ackJson, note, orderNumber);
  }

  /**
   * Fulfil exactly once. Returns true only for the call that performed the
   * fulfilment; concurrent or repeated calls return false.
   */
  fulfilOnce(orderNumber: string, ackJson: string): boolean {
    const at = now();
    const tx = this.db.prepare(
      `UPDATE orders SET state = 'paid', acknowledged_at = ?, ack_json = ?, fulfilled_at = ?, fulfilment_count = fulfilment_count + 1
       WHERE order_number = ? AND fulfilled_at IS NULL`,
    );
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = tx.run(at, ackJson, at, orderNumber);
      if (result.changes === 1) {
        this.db.prepare(`INSERT INTO fulfilments (order_number, fulfilled_at) VALUES (?, ?)`).run(orderNumber, at);
      }
      this.db.exec("COMMIT");
      return result.changes === 1;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }

  get(orderNumber: string): OrderRow | undefined {
    const row = this.db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber) as Record<string, unknown> | undefined;
    return row ? toRow(row) : undefined;
  }

  items(orderNumber: string): OrderItem[] {
    const rows = this.db.prepare(`SELECT product_id, name, unit_minor, quantity FROM order_items WHERE order_number = ? ORDER BY rowid`).all(orderNumber) as Array<Record<string, unknown>>;
    return rows.map((r) => ({ productId: r["product_id"] as string, name: r["name"] as string, unitMinor: r["unit_minor"] as string, quantity: Number(r["quantity"]) }));
  }

  ordersForSession(sessionId: string): OrderRow[] {
    const rows = this.db.prepare(`SELECT * FROM orders WHERE session_id = ? ORDER BY created_at DESC LIMIT 50`).all(sessionId) as Array<Record<string, unknown>>;
    return rows.map(toRow);
  }

  getBySatimOrderId(satimOrderId: string): OrderRow | undefined {
    const row = this.db.prepare(`SELECT * FROM orders WHERE satim_order_id = ?`).get(satimOrderId) as Record<string, unknown> | undefined;
    return row ? toRow(row) : undefined;
  }

  /** Orders registered with SATIM whose customer never came back. */
  staleRegistered(olderThanSeconds: number): OrderRow[] {
    const cutoff = new Date(Date.now() - olderThanSeconds * 1000).toISOString();
    const rows = this.db
      .prepare(`SELECT * FROM orders WHERE state IN ('registered', 'unknown') AND registered_at <= ? ORDER BY registered_at`)
      .all(cutoff) as Record<string, unknown>[];
    return rows.map(toRow);
  }

  fulfilmentCount(orderNumber: string): number {
    const row = this.db.prepare(`SELECT COUNT(*) AS n FROM fulfilments WHERE order_number = ?`).get(orderNumber) as { n: number };
    return row.n;
  }

  close(): void {
    this.db.close();
  }
}

function now(): string {
  return new Date().toISOString();
}

function toRow(r: Record<string, unknown>): OrderRow {
  return {
    orderNumber: r["order_number"] as string,
    sessionId: (r["session_id"] as string | null) ?? null,
    customerEmail: (r["customer_email"] as string | null) ?? null,
    satimOrderId: (r["satim_order_id"] as string | null) ?? null,
    amountMinor: r["amount_minor"] as string,
    currency: "DZD",
    description: r["description"] as string,
    language: r["language"] as OrderRow["language"],
    state: r["state"] as OrderState,
    createdAt: r["created_at"] as string,
    registeredAt: (r["registered_at"] as string | null) ?? null,
    acknowledgedAt: (r["acknowledged_at"] as string | null) ?? null,
    fulfilledAt: (r["fulfilled_at"] as string | null) ?? null,
    fulfilmentCount: Number(r["fulfilment_count"]),
    ackJson: (r["ack_json"] as string | null) ?? null,
    note: (r["note"] as string | null) ?? null,
  };
}
