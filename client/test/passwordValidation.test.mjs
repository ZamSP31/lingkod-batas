import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { transformWithOxc } from "vite";

const source = await fs.readFile(new URL("../src/utils/validation.ts", import.meta.url), "utf8");
const { code } = await transformWithOxc(source, "validation.ts");
const context = vm.createContext({ TextEncoder });
vm.runInContext(code.replace(/^export /gm, "") + "\nthis.validators = { validateNewPassword, validateLoginPassword };", context);
const { validateNewPassword, validateLoginPassword } = context.validators;

test("new password validation enforces both character and UTF-8 byte boundaries", () => {
  assert.equal(validateNewPassword("Aa1" + "é".repeat(34) + "b"), undefined);
  assert.match(validateNewPassword("Aa1" + "é".repeat(35)), /72 UTF-8 bytes/);
  assert.match(validateNewPassword("Aa1" + "x".repeat(48)), /50 characters/);
  assert.equal(validateNewPassword("Aa1" + "x".repeat(47)), undefined);
});

test("safe legacy login lengths remain accepted without bypassing bcrypt byte limits", () => {
  assert.equal(validateLoginPassword("a".repeat(72)), undefined);
  assert.match(validateLoginPassword("a".repeat(73)), /password recovery/);
  assert.match(validateLoginPassword("é".repeat(37)), /password recovery/);
});
