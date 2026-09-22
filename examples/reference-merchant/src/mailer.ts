/**
 * Outbox mailer: writes RFC 5322 messages with the PDF attached to a local
 * directory instead of sending them. Swap for SMTP in production; the
 * interface is the only contract the app depends on.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export interface Mailer {
  /** False when no transport exists; the shop then hides the e-mail receipt form. */
  readonly enabled?: boolean;
  send(message: { to: string; subject: string; text: string; pdf: Buffer; pdfName: string }): Promise<{ id: string }>;
}

export function createOutboxMailer(dir: string): Mailer {
  return {
    async send({ to, subject, text, pdf, pdfName }) {
      mkdirSync(dir, { recursive: true }); // lazily: the directory may be read-only or absent until first use
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const boundary = `b${id}`;
      const eml = [
        `From: receipts@merchant.example`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: base64`,
        ``,
        Buffer.from(text).toString("base64"),
        `--${boundary}`,
        `Content-Type: application/pdf; name="${pdfName}"`,
        `Content-Disposition: attachment; filename="${pdfName}"`,
        `Content-Transfer-Encoding: base64`,
        ``,
        pdf.toString("base64"),
        `--${boundary}--`,
        ``,
      ].join("\r\n");
      writeFileSync(join(dir, `${id}.eml`), eml);
      return { id };
    },
  };
}

export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

/** Used where no mail transport exists (serverless without SMTP_URL): fails explicitly. */
export function createUnconfiguredMailer(): Mailer {
  return {
    enabled: false,
    async send() {
      throw new Error("no mail transport configured: set SMTP_URL");
    },
  };
}
