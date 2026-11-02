import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";

// Start the app first. TEST_BASE_URL can point at a separate local test port.
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
// A valid synthetic 64px white PNG, containing no patient data.
function chunk(type, data) {
  const content = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of content) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, content, checksum]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(64, 0); ihdr.writeUInt32BE(64, 4); ihdr[8] = 8; ihdr[9] = 2;
const scanlines = Buffer.alloc(64 * (1 + 64 * 3), 255);
for (let row = 0; row < 64; row++) scanlines[row * (1 + 64 * 3)] = 0;
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(scanlines)), chunk("IEND", Buffer.alloc(0))]);
const form = (bytes, type = "image/png", query = "") => {
  const body = new FormData();
  body.set("image", new Blob([bytes], { type }), "test-image");
  body.set("query", query);
  return body;
};
for (const [name, body, expected] of [
  ["missing image", new FormData(), 400],
  ["forged image signature", form("not an image", "image/jpeg"), 415],
  ["unsupported format", form("heic", "image/heic"), 415],
  ["oversized file", form(Buffer.alloc(3 * 1024 * 1024 + 1)), 413],
  ["oversized context", form(png, "image/png", "x".repeat(401)), 400],
]) {
  const response = await fetch(`${base}/api/image-search`, { method: "POST", body });
  assert.equal(response.status, expected, name);
  assert.equal(response.headers.get("cache-control"), "no-store");
  console.log(`PASS ${name}`);
}
const invalidText = await fetch(`${base}/api/search`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "" }),
});
assert.equal(invalidText.status, 400);
console.log("PASS text validation");

// Opt in: these checks call the configured Gemini and Supabase services.
if (process.env.TEST_LIVE === "1") {
  const response = await fetch(`${base}/api/image-search`, { method: "POST", body: form(png) });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.assessment.assessable, false);
  assert.equal(data.retrieval, null);
  assert.equal(typeof data.assessment.summary, "string");
  console.log("PASS live vision: non-clinical image is not assessable");
  const text = await fetch(`${base}/api/search`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "dental caries causes" }),
  });
  const result = await text.json();
  assert.equal(text.status, 200, JSON.stringify(result));
  assert.ok(result.results.every(page => page.similarity >= result.meta.threshold));
  console.log(`PASS live text retrieval: ${result.results.length} passages`);
}
