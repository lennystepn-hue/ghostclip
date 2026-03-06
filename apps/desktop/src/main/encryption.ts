import { encrypt, decrypt, deriveKeys, generateVaultKey } from "@ghostclip/crypto";
import { getSetting, setSetting } from "./db";
import { safeStorage } from "electron";

let vaultKey: Buffer | null = null;

/** Read vault key from OS-level encrypted storage (Keychain/DPAPI/libsecret) */
function readProtectedVaultKey(): Buffer | null {
  const encrypted = getSetting("vaultKeyProtected");
  if (!encrypted) return null;
  try {
    if (safeStorage.isEncryptionAvailable()) {
      const decrypted = safeStorage.decryptString(Buffer.from(encrypted, "base64"));
      return Buffer.from(decrypted, "base64");
    }
  } catch {}
  return null;
}

/** Write vault key using OS-level encryption */
function writeProtectedVaultKey(key: Buffer): void {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(key.toString("base64"));
    setSetting("vaultKeyProtected", encrypted.toString("base64"));
    // Remove legacy plaintext key if it exists
    setSetting("vaultKey", "");
  } else {
    // Fallback for environments without OS keyring (rare)
    setSetting("vaultKey", key.toString("base64"));
  }
}

export function initEncryption(): boolean {
  // Try OS-protected key first, then fall back to legacy plaintext
  const protectedKey = readProtectedVaultKey();
  if (protectedKey) {
    vaultKey = protectedKey;
    return true;
  }

  // Migrate legacy plaintext key to protected storage
  const legacyKey = getSetting("vaultKey");
  if (legacyKey) {
    vaultKey = Buffer.from(legacyKey, "base64");
    writeProtectedVaultKey(vaultKey); // migrate to protected
    return true;
  }

  return false;
}

export async function setupEncryption(password: string, email: string): Promise<void> {
  const { masterKey } = await deriveKeys(password, email);
  const newVaultKey = generateVaultKey();

  // Encrypt vault key with master key (for server-side backup)
  const encryptedVault = encrypt(newVaultKey.toString("base64"), masterKey);
  setSetting("encryptedVaultKey", encryptedVault.toString("base64"));

  // Store vault key using OS-level encryption
  writeProtectedVaultKey(newVaultKey);
  vaultKey = newVaultKey;
}

export async function unlockVault(password: string, email: string): Promise<boolean> {
  const { masterKey } = await deriveKeys(password, email);
  const encryptedVault = getSetting("encryptedVaultKey");

  if (!encryptedVault) return false;

  try {
    const decrypted = decrypt(Buffer.from(encryptedVault, "base64"), masterKey);
    vaultKey = Buffer.from(decrypted, "base64");
    writeProtectedVaultKey(vaultKey); // Cache using OS encryption
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
