import { describe, it, expect } from "vitest";
import { deriveKeys, encrypt, decrypt, generateVaultKey, encryptBuffer, decryptBuffer } from "../index";

describe("Key Derivation", () => {
  it("derives auth key and master key from password", async () => {
    const { authKey, masterKey } = await deriveKeys("test-password", "test@example.com");
    expect(authKey).toBeInstanceOf(Buffer);
    expect(masterKey).toBeInstanceOf(Buffer);
    expect(authKey.length).toBe(32);
    expect(masterKey.length).toBe(32);
    expect(authKey.equals(masterKey)).toBe(false);
  });

  it("produces same keys for same input", async () => {
    const a = await deriveKeys("password", "user@test.com");
    const b = await deriveKeys("password", "user@test.com");
    expect(a.authKey.equals(b.authKey)).toBe(true);
    expect(a.masterKey.equals(b.masterKey)).toBe(true);
  });

  it("produces different keys for different passwords", async () => {
    const a = await deriveKeys("password1", "user@test.com");
    const b = await deriveKeys("password2", "user@test.com");
    expect(a.authKey.equals(b.authKey)).toBe(false);
  });

  it("generates a 32-byte vault key", () => {
    const key = generateVaultKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });
});

describe("Encrypt / Decrypt (String)", () => {
  it("encrypts and decrypts text", () => {
    const key = Buffer.alloc(32, "a");
    const plaintext = "Hello GhostClip!";
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("produces different ciphertext each time (unique IV)", () => {
    const key = Buffer.alloc(32, "b");
    const plaintext = "same text";
    const a = encrypt(plaintext, key);
    const b = encrypt(plaintext, key);
    expect(a.equals(b)).toBe(false);
  });

  it("fails with wrong key", () => {
    const key1 = Buffer.alloc(32, "a");
    const key2 = Buffer.alloc(32, "b");
    const encrypted = encrypt("secret", key1);
    expect(() => decrypt(encrypted, key2)).toThrow();
  });

  it("handles empty strings", () => {
    const key = Buffer.alloc(32, "c");
    const encrypted = encrypt("", key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe("");
  });

  it("handles unicode text", () => {
    const key = Buffer.alloc(32, "d");
    const plaintext = "Hallo Welt! 🎉 Ünïcödë";
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });
});

describe("Encrypt / Decrypt (Buffer)", () => {
  it("encrypts and decrypts buffers", () => {
    const key = Buffer.alloc(32, "e");
    const data = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
    const encrypted = encryptBuffer(data, key);
    const decrypted = decryptBuffer(encrypted, key);
    expect(decrypted.equals(data)).toBe(true);
  });
});
