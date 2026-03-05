import { pbkdf2, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 600_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export async function deriveKeys(password: string, email: string): Promise<{ authKey: Buffer; masterKey: Buffer }> {
  const salt = Buffer.from(email.toLowerCase().trim(), "utf-8");
  const derived = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH * 2, DIGEST);
  return {
    authKey: derived.subarray(0, KEY_LENGTH),
    masterKey: derived.subarray(KEY_LENGTH),
  };
}

export function generateVaultKey(): Buffer {
  return randomBytes(32);
}
