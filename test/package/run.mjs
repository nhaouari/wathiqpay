// Pack the built package, install it into a clean temporary consumer, and
// verify public imports and TypeScript declarations work from the tarball.
import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(new URL("../..", import.meta.url).pathname);
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const packOut = JSON.parse(run("npm pack --json --ignore-scripts"));
const tarball = join(root, packOut[0].filename);
const files = packOut[0].files.map((f) => f.path);
const allowed = /^(dist\/.*|README\.md|package\.json|LICENSE)$/;
const unexpected = files.filter((f) => !allowed.test(f));
if (unexpected.length) throw new Error(`unexpected files in tarball: ${unexpected.join(", ")}`);
for (const f of files) {
  if (/(secret|\.env|fixtures|test\/)/i.test(f)) throw new Error(`forbidden file in tarball: ${f}`);
}
console.log(`tarball ok: ${files.length} files`);

const consumer = mkdtempSync(join(tmpdir(), "wathiqpay-consumer-"));
try {
  writeFileSync(join(consumer, "package.json"), JSON.stringify({ name: "consumer", private: true, type: "module" }));
  run(`npm install --no-audit --no-fund --ignore-scripts "${tarball}"`, consumer);
  const tsVersion = JSON.parse(readFileSync(join(root, "node_modules/typescript/package.json"), "utf8")).version;
  run(`npm install --no-audit --no-fund --ignore-scripts typescript@${tsVersion} @types/node@22`, consumer);

  writeFileSync(join(consumer, "main.ts"), `
import { createClient, classifyPayment, toMinorUnits, ValidationError, type AcknowledgeResult, type PaymentState } from "wathiqpay";
const client = createClient({
  environment: "certification", username: "u", password: "p", terminalId: "T",
  transport: async () => ({ status: 200, bodyText: JSON.stringify({ ErrorCode: "0", OrderStatus: 2, params: { respCode: "00" } }) }),
});
const r: AcknowledgeResult = await client.acknowledgeTransaction("x");
const s: PaymentState = classifyPayment(r);
if (s !== "paid") throw new Error("expected paid, got " + s);
if (toMinorUnits({ value: "806.50", currency: "DZD" }) !== "80650") throw new Error("money");
try { await client.registerOrder({ orderNumber: "TOO-LONG-NUMBER", amount: { value: "1", currency: "DZD" }, returnUrl: "https://a.example", failUrl: "https://a.example" }); }
catch (e) { if (!(e instanceof ValidationError)) throw e; }
console.log("consumer ok:", s);
`);
  writeFileSync(join(consumer, "tsconfig.json"), JSON.stringify({
    compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2022", strict: true, types: ["node"], outDir: "out", skipLibCheck: false },
    include: ["main.ts"],
  }));
  run("npx tsc -p tsconfig.json", consumer);
  process.stdout.write(run("node out/main.js", consumer));
} finally {
  rmSync(consumer, { recursive: true, force: true });
  rmSync(tarball, { force: true });
}
