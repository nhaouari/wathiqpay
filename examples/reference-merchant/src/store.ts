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

export interface OrderRow {
  orderNumber: string;
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
      CREATE TABLE IF NOT EXISTS fulfilments (
        order_number TEXT PRIMARY KEY REFERENCES orders(order_number),
        fulfilled_at TEXT NOT NULL
      );
    `);
  }

  /** Insert a pending order, retrying on the (astronomically unlikely) reference collision. */
  createPending(input: { amountMinor: string; description: string; language: OrderRow["language"] }): OrderRow {
    const stmt = this.db.prepare(
      `INSERT INTO orders (order_number, amount_minor, currency, description, language, state, created_at)
       VALUES (?, ?, 'DZD', ?, ?, 'pending', ?)`,
    );
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const orderNumber = generateOrderNumber();
      try {
        stmt.run(orderNumber, input.amountMinor, input.description, input.language, now());
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
