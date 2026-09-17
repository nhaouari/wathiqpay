/**
 * Dependency-free single-page PDF receipt using the standard Helvetica font.
 * Limitation: standard PDF fonts only cover Latin text (WinAnsi), so the PDF
 * is rendered with French or English labels. Arabic PDF receipts need an
 * embedded font, which a production merchant should add.
 */

export interface ReceiptLine {
  label: string;
  value: string;
}

export function buildReceiptPdf(title: string, lines: ReceiptLine[], footer: string[]): Buffer {
  const content: string[] = [];
  let y = 790;
  const text = (x: number, size: number, s: string, bold = false) => {
    content.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y} Td (${escapePdf(s)}) Tj ET`);
  };
  text(50, 18, title, true);
  y -= 34;
  for (const line of lines) {
    text(50, 11, line.label, true);
    text(230, 11, line.value);
    y -= 20;
  }
  y -= 10;
  for (const f of footer) {
    text(50, 10, f);
    y -= 16;
  }
  const stream = Buffer.from(content.join("\n"), "latin1");

  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    Buffer.from("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>"),
    Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from("\nendstream")]),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
  ];

  const parts: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
  const offsets: number[] = [];
  let length = parts[0]!.length;
  objects.forEach((obj, i) => {
    offsets.push(length);
    const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), obj, Buffer.from("\nendobj\n")]);
    parts.push(chunk);
    length += chunk.length;
  });
  const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`, ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)].join("");
  parts.push(Buffer.from(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`));
  return Buffer.concat(parts);
}

function escapePdf(s: string): string {
  // Map to WinAnsi where possible; replace anything outside Latin-1 with '?'.
  const latin = Array.from(s, (ch) => (ch.charCodeAt(0) <= 0xff ? ch : "?")).join("");
  return latin.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
