import { encrypt, decrypt, deriveKeys, generateVaultKey } from "@ghostclip/crypto";
import { getSetting, setSetting } from "./db";

let vaultKey: Buffer | null = null;

export function initEncryption(): boolean {
  const stored = getSetting("vaultKey");
  if (stored) {
    vaultKey = Buffer.from(stored, "base64");
    return true;
  }
  return false;
}

export async function setupEncryption(password: string, email: string): Promise<void> {
  const { masterKey } = await deriveKeys(password, email);
  const newVaultKey = generateVaultKey();

  // Encrypt vault key with master key and store it
  const encryptedVault = encrypt(newVaultKey.toString("base64"), masterKey);
  setSetting("vaultKey", newVaultKey.toString("base64"));
  setSetting("encryptedVaultKey", encryptedVault.toString("base64"));
  vaultKey = newVaultKey;
}

export async function unlockVault(password: string, email: string): Promise<boolean> {
  const { masterKey } = await deriveKeys(password, email);
  const encryptedVault = getSetting("encryptedVaultKey");

  if (!encryptedVault) return false;

  try {
    const decrypted = decrypt(Buffer.from(encryptedVault, "base64"), masterKey);
    vaultKey = Buffer.from(decrypted, "base64");
    setSetting("vaultKey", decrypted); // Cache for quick access
    return true;
  } catch {
    return false;
  }
}

export function encryptContent(plaintext: string): string | null {
  if (!vaultKey) return null;
  const encrypted = encrypt(plaintext, vaultKey);
  return encrypted.toString("base64");
}

export function decryptContent(encryptedBase64: string): string | null {
  if (!vaultKey) return null;
  try {
    return decrypt(Buffer.from(encryptedBase64, "base64"), vaultKey);
  } catch {
    return null;
  }
}

export function isEncryptionReady(): boolean {
  return vaultKey !== null;
}
