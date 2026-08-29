import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing with scrypt from the standard library.
 *
 * Storing a password we can read back is never acceptable, hackathon or not:
 * people reuse passwords, so a leak here becomes a leak of their bank. scrypt
 * is deliberately slow and memory-hard, each password gets its own salt so one
 * cracked hash reveals nothing about the rest, and verification is a
 * constant-time compare so timing cannot be used to guess a hash byte by byte.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export interface PasswordHash {
  hash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return { hash: derived.toString("hex"), salt: salt.toString("hex") };
}

export async function verifyPassword(
  password: string,
  stored: PasswordHash,
): Promise<boolean> {
  try {
    const salt = Buffer.from(stored.salt, "hex");
    const expected = Buffer.from(stored.hash, "hex");

    // A malformed hex string decodes to zero bytes, and comparing two empty
    // buffers succeeds — which would make a corrupt row accept any password.
    // Both halves must be exactly the length we write.
    if (expected.length !== KEY_LENGTH || salt.length !== SALT_LENGTH) return false;

    const derived = await scryptAsync(password, salt, KEY_LENGTH);
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}
