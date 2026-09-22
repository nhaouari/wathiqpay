/**
 * Minimal dependency-free SMTP client: implicit TLS (SMTPS, port 465) with
 * AUTH PLAIN, enough to send the receipt e-mail from a production host.
 * Configure with SMTP_URL=smtps://user:pass@host:465 and SMTP_FROM.
 */
import { connect, type TLSSocket } from "node:tls";
import { once } from "node:events";
import type { Mailer } from "./mailer.js";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

export function parseSmtpUrl(url: string, from: string): SmtpConfig {
  const u = new URL(url);
  if (u.protocol !== "smtps:") throw new Error("SMTP_URL must use smtps:// (implicit TLS)");
  return { host: u.hostname, port: Number(u.port || 465), user: decodeURIComponent(u.username), pass: decodeURIComponent(u.password), from };
}

class SmtpSession {
  private buffer = "";
  constructor(private readonly socket: TLSSocket) {}

  async expect(codes: number[]): Promise<string> {
    for (;;) {
      const lines = this.buffer.split("\r\n");
      const end = lines.findIndex((l) => /^\d{3} /.test(l)); // final reply line has a space after the code
      if (end >= 0) {
        const reply = lines.slice(0, end + 1).join("\r\n");
        this.buffer = lines.slice(end + 1).join("\r\n");
        const code = Number(reply.slice(0, 3));
        if (!codes.includes(code)) throw new Error(`SMTP error ${code}`);
        return reply;
      }
      const [chunk] = (await once(this.socket, "data")) as [Buffer];
      this.buffer += chunk.toString("utf8");
    }
  }

  async command(line: string, codes: number[]): Promise<string> {
    this.socket.write(`${line}\r\n`);
    return this.expect(codes);
  }
}

export function buildMime(config: SmtpConfig, m: { to: string; subject: string; text: string; pdf: Buffer; pdfName: string }, id: string): string {
  const boundary = `b${id}`;
  return [
    `From: ${config.from}`,
    `To: ${m.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(m.subject).toString("base64")}?=`,
    `Message-ID: <${id}@${config.host}>`,
    `Date: ${new Date().toUTCString()}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(m.text).toString("base64"),
    `--${boundary}`,
    `Content-Type: application/pdf; name="${m.pdfName}"`,
    `Content-Disposition: attachment; filename="${m.pdfName}"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    m.pdf.toString("base64").replace(/(.{76})/g, "$1\r\n"),
    `--${boundary}--`,
    ``,
  ].join("\r\n");
}

export function createSmtpMailer(config: SmtpConfig): Mailer {
  return {
    async send(message) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const mime = buildMime(config, message, id);
      const socket = connect({ host: config.host, port: config.port, servername: config.host });
      await once(socket, "secureConnect");
      const s = new SmtpSession(socket);
      try {
        await s.expect([220]);
        await s.command(`EHLO wathiqpay-merchant`, [250]);
        await s.command(`AUTH PLAIN ${Buffer.from(`\0${config.user}\0${config.pass}`).toString("base64")}`, [235]);
        await s.command(`MAIL FROM:<${config.from.replace(/^.*<|>.*$/g, "")}>`, [250]);
        await s.command(`RCPT TO:<${message.to}>`, [250, 251]);
        await s.command(`DATA`, [354]);
        await s.command(`${mime.replace(/\r\n\./g, "\r\n..")}\r\n.`, [250]); // dot-stuffing, RFC 5321
        await s.command(`QUIT`, [221]);
      } finally {
        socket.end();
      }
      return { id };
    },
  };
}
