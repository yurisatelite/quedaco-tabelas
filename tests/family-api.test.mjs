import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("publica o protocolo QUEDAÇO v1 no ready", async () => {
  const source = await readFile(new URL("../src/main.mjs", import.meta.url), "utf8");
  assert.match(source, /family:\s*"quedaco"/);
  assert.match(source, /contractVersion:\s*1/);
  assert.match(source, /tableBuilder:\s*true/);
  assert.match(source, /Hooks\.callAll\("quedaco:register", descriptor\)/);
  assert.match(source, /module\.api = descriptor/);
});
