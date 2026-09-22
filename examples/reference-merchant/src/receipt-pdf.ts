/**
 * Single-page PDF receipts without a PDF library.
 *
 * - Receipts flow onto further pages when long; long values wrap by words.
 * - French and English: the standard Helvetica fonts (WinAnsi), no embedding.
 * - Arabic: Arabic runs are shaped with HarfBuzz and drawn in an embedded
 *   Noto Sans Arabic (CIDFontType2, Identity-H, FlateDecode). Latin runs
 *   (order numbers, "DZD", "CIB / Edahabia") stay in Helvetica, and runs are
 *   laid out right to left with a small bidi resolver sufficient for receipt
 *   labels and values.
 */
import { readFileSync, existsSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface ReceiptLine {
  label: string;
  value: string;
}

export interface ReceiptPdfInput {
  direction: "ltr" | "rtl";
  title: string;
  lines: ReceiptLine[];
  footer: string[];
}

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

// ---------------------------------------------------------------------------
// Helvetica metrics (AFM widths, 1/1000 em) for measuring Latin runs.

const HELV: Record<string, number> = {};
const HELV_BOLD: Record<string, number> = {};
{
  const chars = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
  const reg = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
  const bold = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
  [...chars].forEach((c, i) => {
    HELV[c] = reg[i]!;
    HELV_BOLD[c] = bold[i]!;
  });
  HELV["×"] = HELV_BOLD["×"] = 584;
  HELV["\u00a0"] = HELV_BOLD["\u00a0"] = 278;
}

function helvWidth(s: string, size: number, bold: boolean): number {
  const table = bold ? HELV_BOLD : HELV;
  let w = 0;
  for (const ch of s) w += table[ch] ?? 556;
  return (w * size) / 1000;
}

function escapeLatin(s: string): string {
  const latin = Array.from(s, (ch) => (ch.charCodeAt(0) <= 0xff ? ch : "?")).join("");
  return latin.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

// ---------------------------------------------------------------------------
// Arabic shaping (lazy: HarfBuzz and the fonts load only for Arabic receipts).

const HERE = dirname(fileURLToPath(import.meta.url));
const FONT_DIR = [
  join(HERE, "..", "fonts"),
  join(HERE, "..", "..", "..", "..", "examples", "reference-merchant", "fonts"),
  join(process.cwd(), "examples", "reference-merchant", "fonts"),
].find((d) => existsSync(d)) ?? join(HERE, "..", "fonts");

interface ShapedGlyph {
  gid: number;
  xAdvance: number;
  xOffset: number;
  yOffset: number;
}

interface ArabicFont {
  key: "A1" | "A2";
  name: string;
  data: Buffer;
  upem: number;
  ascender: number;
  descender: number;
  shape(text: string): ShapedGlyph[];
  /** Whether the font has a glyph for this character. */
  covers(ch: string): boolean;
  used: Map<number, number>; // gid -> advance in font units
}

type HB = typeof import("harfbuzzjs");
let hbPromise: Promise<HB> | undefined;
const fontCache = new Map<string, Promise<Omit<ArabicFont, "used">>>();

async function loadArabicFont(file: string, key: ArabicFont["key"]): Promise<ArabicFont> {
  hbPromise ??= import("harfbuzzjs");
  if (!fontCache.has(file)) {
    fontCache.set(
      file,
      (async () => {
        const hb = await hbPromise!;
        const data = readFileSync(join(FONT_DIR, file));
        const face = new hb.Face(new hb.Blob(data));
        const font = new hb.Font(face);
        const ext = font.hExtents();
        const coverage = new Map<string, boolean>();
        return {
          key,
          name: file.replace(/\.ttf$/, ""),
          data,
          upem: face.upem,
          ascender: ext.ascender,
          descender: ext.descender,
          shape(text: string): ShapedGlyph[] {
            const buf = new hb.Buffer();
            buf.addText(text);
            buf.setDirection(hb.Direction.RTL);
            buf.setScript("Arab");
            buf.setLanguage("ar");
            hb.shape(font, buf);
            const infos = buf.getGlyphInfos();
            const pos = buf.getGlyphPositions();
            return infos.map((g, i) => ({ gid: g.codepoint, xAdvance: pos[i]!.xAdvance, xOffset: pos[i]!.xOffset, yOffset: pos[i]!.yOffset }));
          },
          covers(ch: string): boolean {
            let hit = coverage.get(ch);
            if (hit === undefined) {
              const buf = new hb.Buffer();
              buf.addText(ch);
              buf.guessSegmentProperties();
              hb.shape(font, buf);
              hit = buf.getGlyphInfos().every((g) => g.codepoint !== 0);
              coverage.set(ch, hit);
            }
            return hit;
          },
        };
      })(),
    );
  }
  const base = await fontCache.get(file)!;
  return { ...base, used: new Map() };
}

// ---------------------------------------------------------------------------
// Minimal bidi: split into Arabic and non-Arabic runs; neutrals between two
// runs of the same kind join them, otherwise they take the paragraph (RTL).

const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const STRONG_LATIN = /[A-Za-z0-9À-ɏ]/;

interface Run {
  arabic: boolean;
  text: string;
}

export function bidiRuns(text: string): Run[] {
  const chars = [...text];
  const kind = chars.map((c) => (ARABIC.test(c) ? "A" : STRONG_LATIN.test(c) ? "L" : "N"));
  for (let i = 0; i < kind.length; i += 1) {
    if (kind[i] !== "N") continue;
    let j = i;
    while (j < kind.length && kind[j] === "N") j += 1;
    const before = i > 0 ? kind[i - 1] : undefined;
    const after = j < kind.length ? kind[j] : undefined;
    const resolved = before && after && before === after ? before : "A"; // paragraph direction is RTL
    for (let k = i; k < j; k += 1) kind[k] = resolved;
    i = j - 1;
  }
  const runs: Run[] = [];
  chars.forEach((c, i) => {
    const arabic = kind[i] === "A";
    const last = runs[runs.length - 1];
    if (last && last.arabic === arabic) last.text += c;
    else runs.push({ arabic, text: c });
  });
  return runs;
}

interface LaidRun {
  width: number;
  draw(x: number, y: number): string;
}

function layoutRtl(text: string, size: number, bold: boolean, fonts: { reg: ArabicFont; bold: ArabicFont }): LaidRun {
  const font = bold ? fonts.bold : fonts.reg;
  // Characters the Arabic font lacks (e.g. "/") inside an Arabic run are drawn in Helvetica.
  const runs = bidiRuns(text).flatMap((run): Run[] => {
    if (!run.arabic) return [run];
    const out: Run[] = [];
    for (const ch of run.text) {
      const arabic = ch === " " || font.covers(ch);
      const last = out[out.length - 1];
      if (last && last.arabic === arabic) last.text += ch;
      else out.push({ arabic, text: ch });
    }
    return out;
  });
  const pieces = runs.map((run): LaidRun => {
    if (!run.arabic) {
      const t = run.text;
      return { width: helvWidth(t, size, bold), draw: (x, y) => `BT /${bold ? "F2" : "F1"} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapeLatin(t)}) Tj ET` };
    }
    const glyphs = font.shape(run.text);
    const scale = size / font.upem;
    const width = glyphs.reduce((w, g) => w + g.xAdvance, 0) * scale;
    for (const g of glyphs) font.used.set(g.gid, g.xAdvance);
    return {
      width,
      draw: (x, y) => {
        let pen = x;
        const ops = [`BT /${font.key} ${size} Tf`];
        for (const g of glyphs) {
          ops.push(`1 0 0 1 ${(pen + g.xOffset * scale).toFixed(2)} ${(y + g.yOffset * scale).toFixed(2)} Tm <${g.gid.toString(16).padStart(4, "0")}> Tj`);
          pen += g.xAdvance * scale;
        }
        ops.push("ET");
        return ops.join("\n");
      },
    };
  });
  // Runs are in logical order; in an RTL paragraph the first run is rightmost.
  const width = pieces.reduce((w, p) => w + p.width, 0);
  return {
    width,
    draw: (xLeft, y) => {
      let right = xLeft + width;
      const ops: string[] = [];
      for (const p of pieces) {
        right -= p.width;
        ops.push(p.draw(right, y));
      }
      return ops.join("\n");
    },
  };
}

// ---------------------------------------------------------------------------
// PDF assembly.

function fontObjects(font: ArabicFont, firstObj: number): { objects: Buffer[]; ref: number } {
  // objects: Type0, CIDFont, FontDescriptor, FontFile2
  const [type0, cid, desc, file] = [firstObj, firstObj + 1, firstObj + 2, firstObj + 3];
  const k = 1000 / font.upem;
  const widths = [...font.used.entries()].sort((a, b) => a[0] - b[0]).map(([gid, adv]) => `${gid} [${Math.round(adv * k)}]`).join(" ");
  const compressed = deflateSync(font.data);
  const psName = font.name.replace(/[^A-Za-z0-9-]/g, "");
  return {
    ref: type0,
    objects: [
      Buffer.from(`<< /Type /Font /Subtype /Type0 /BaseFont /${psName} /Encoding /Identity-H /DescendantFonts [${cid} 0 R] >>`),
      Buffer.from(`<< /Type /Font /Subtype /CIDFontType2 /BaseFont /${psName} /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /FontDescriptor ${desc} 0 R /CIDToGIDMap /Identity /DW 500 /W [${widths}] >>`),
      Buffer.from(`<< /Type /FontDescriptor /FontName /${psName} /Flags 4 /FontBBox [-600 -500 1600 1200] /ItalicAngle 0 /Ascent ${Math.round(font.ascender * k)} /Descent ${Math.round(font.descender * k)} /CapHeight 700 /StemV 80 /FontFile2 ${file} 0 R >>`),
      Buffer.concat([Buffer.from(`<< /Length ${compressed.length} /Length1 ${font.data.length} /Filter /FlateDecode >>\nstream\n`), compressed, Buffer.from("\nendstream")]),
    ],
  };
}

function assemble(pages: string[], extraFonts: ArabicFont[]): Buffer {
  // 1 catalog, 2 pages tree, 3 Helvetica, 4 Helvetica-Bold, then embedded fonts, then (page, content) pairs.
  const fontRefs: string[] = ["/F1 3 0 R", "/F2 4 0 R"];
  let next = 5;
  const fontObjs: Buffer[] = [];
  for (const f of extraFonts) {
    if (f.used.size === 0) continue;
    const { objects: objs, ref } = fontObjects(f, next);
    fontRefs.push(`/${f.key} ${ref} 0 R`);
    fontObjs.push(...objs);
    next += objs.length;
  }
  const pageObjs: Buffer[] = [];
  const kids: string[] = [];
  for (const content of pages) {
    const pageNo = next;
    const contentNo = next + 1;
    next += 2;
    kids.push(`${pageNo} 0 R`);
    const stream = Buffer.from(content, "latin1");
    pageObjs.push(
      Buffer.from(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentNo} 0 R /Resources << /Font << ${fontRefs.join(" ")} >> >> >>`),
      Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`), stream, Buffer.from("\nendstream")]),
    );
  }
  const objects: Buffer[] = [
    Buffer.from("<< /Type /Catalog /Pages 2 0 R >>"),
    Buffer.from(`<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >>`),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
    ...fontObjs,
    ...pageObjs,
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

// ---------------------------------------------------------------------------
// Page flow shared by both directions: new page when the next line would
// cross the bottom margin; long values wrap by words.

const TOP = 790;
const BOTTOM = 70;

class PageFlow {
  pages: string[][] = [[]];
  y = TOP;
  get current(): string[] {
    return this.pages[this.pages.length - 1]!;
  }
  /** Reserve `h` points for the next line, breaking the page if needed. */
  line(h: number): number {
    if (this.y - h < BOTTOM) {
      this.pages.push([]);
      this.y = TOP;
    }
    const y = this.y;
    this.y -= h;
    return y;
  }
  gap(h: number): void {
    this.y -= h;
  }
}

/** Keep amounts ("1 800,00 DZD", "1 800,00 دج") on one line: join their spaces with no-break spaces. */
function glueAmounts(text: string): string {
  return text.replace(/(\d) (?=\d)/g, "$1\u00a0").replace(/ (DZD|دج)/g, "\u00a0$1");
}

function wrap(raw: string, maxWidth: number, measure: (s: string) => number): string[] {
  const text = glueAmounts(raw);
  if (measure(text) <= maxWidth) return [text];
  const words = text.split(/ +/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measure(next) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

function buildLtr(input: ReceiptPdfInput): Buffer {
  const flow = new PageFlow();
  const text = (y: number, x: number, size: number, s: string, bold = false) =>
    flow.current.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${x} ${y.toFixed(2)} Td (${escapeLatin(s)}) Tj ET`);
  const valueX = 230;
  const valueW = PAGE_W - MARGIN - valueX;
  text(flow.line(34), MARGIN, 18, input.title, true);
  for (const line of input.lines) {
    const parts = wrap(line.value, valueW, (s) => helvWidth(s, 11, false));
    parts.forEach((part, i) => {
      const y = flow.line(i === parts.length - 1 ? 20 : 15);
      if (i === 0) text(y, MARGIN, 11, line.label, true);
      text(y, valueX, 11, part);
    });
  }
  flow.gap(10);
  for (const f of input.footer) text(flow.line(16), MARGIN, 10, f);
  const total = flow.pages.length;
  if (total > 1) {
    flow.pages.forEach((page, i) => page.push(`BT /F1 9 Tf ${MARGIN} 40 Td (${i + 1} / ${total}) Tj ET`));
  }
  return assemble(flow.pages.map((p) => p.join("\n")), []);
}

async function buildRtl(input: ReceiptPdfInput): Promise<Buffer> {
  const fonts = { reg: await loadArabicFont("NotoSansArabic-Regular.ttf", "A1"), bold: await loadArabicFont("NotoSansArabic-Bold.ttf", "A2") };
  const flow = new PageFlow();
  const right = PAGE_W - MARGIN;
  const valueRight = 360;
  const valueW = valueRight - MARGIN;
  const put = (y: number, s: string, size: number, bold: boolean, rightEdge: number) => {
    const run = layoutRtl(s, size, bold, fonts);
    flow.current.push(run.draw(rightEdge - run.width, y));
  };
  put(flow.line(36), input.title, 18, true, right);
  for (const line of input.lines) {
    const parts = wrap(line.value, valueW, (s) => layoutRtl(s, 11, false, fonts).width);
    parts.forEach((part, i) => {
      const y = flow.line(i === parts.length - 1 ? 22 : 16);
      if (i === 0) put(y, line.label, 11, true, right);
      put(y, part, 11, false, valueRight);
    });
  }
  flow.gap(10);
  for (const f of input.footer) put(flow.line(18), f, 10, false, right);
  const total = flow.pages.length;
  if (total > 1) {
    flow.pages.forEach((page, i) => page.push(`BT /F1 9 Tf ${right - 30} 40 Td (${i + 1} / ${total}) Tj ET`));
  }
  return assemble(flow.pages.map((p) => p.join("\n")), [fonts.reg, fonts.bold]);
}

export async function buildReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  return input.direction === "rtl" ? buildRtl(input) : buildLtr(input);
}
