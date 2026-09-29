import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("Vercel API functions include Sharp's Linux native runtime", () => {
  const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
  const lockfile = fs.readFileSync(path.join(root, "package-lock.json"), "utf8");

  assert.match(nextConfig, /outputFileTracingIncludes/);
  assert.match(nextConfig, /@img\/sharp-linux-x64/);
  assert.match(nextConfig, /@img\/sharp-libvips-linux-x64/);
  assert.match(lockfile, /node_modules\/@img\/sharp-linux-x64/);
  assert.match(lockfile, /node_modules\/@img\/sharp-libvips-linux-x64/);
});
