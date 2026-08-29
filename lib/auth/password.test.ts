import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "./password";

test("the stored hash never contains the password", async () => {
  const password = "correct horse battery staple";
  const stored = await hashPassword(password);

  assert.ok(!stored.hash.includes(password));
  assert.ok(!stored.salt.includes(password));
  assert.equal(stored.hash.length, 128, "64 bytes of derived key, hex encoded");
});

test("the right password verifies and a wrong one does not", async () => {
  const stored = await hashPassword("correct horse battery staple");

  assert.equal(await verifyPassword("correct horse battery staple", stored), true);
  assert.equal(await verifyPassword("correct horse battery stapl", stored), false);
  assert.equal(await verifyPassword("", stored), false);
});

test("the same password hashes differently for each account", async () => {
  const first = await hashPassword("shared password");
  const second = await hashPassword("shared password");

  // Per-account salts: cracking one hash reveals nothing about the others,
  // and identical passwords are not visible as identical rows.
  assert.notEqual(first.hash, second.hash);
  assert.notEqual(first.salt, second.salt);
});

test("a corrupt stored hash is rejected rather than throwing", async () => {
  assert.equal(await verifyPassword("anything", { hash: "zzzz", salt: "zzzz" }), false);
  assert.equal(await verifyPassword("anything", { hash: "", salt: "" }), false);
});
