import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { pool } from "../../database/connection";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required. Refusing to start with an insecure default.");
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 12;

/** Hash a refresh token with SHA-256 for fast O(1) lookup.
 *  Refresh tokens are 64 random bytes — brute-forcing is infeasible,
 *  so bcrypt's slowness adds no security value here, only DoS risk. */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export interface RegisterInput {
  email: string;
  password: string;
  encryptedVaultKey: string; // base64 encoded
  deviceName: string;
  platform: string;
  publicKey: string;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  publicKey?: string;
}

export async function register(input: RegisterInput) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const vaultKeyBuffer = Buffer.from(input.encryptedVaultKey, "base64");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, auth_key_hash, encrypted_vault_key, plan)
       VALUES ($1, $2, $2, $3, 'free')
       RETURNING id, email, plan, created_at`,
      [input.email, passwordHash, vaultKeyBuffer]
    );
    const user = userResult.rows[0];

    // Create device
    const deviceResult = await client.query(
      `INSERT INTO devices (user_id, name, platform, public_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, platform, last_sync, created_at`,
      [user.id, input.deviceName, input.platform, input.publicKey]
    );
    const device = deviceResult.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, deviceId: device.id },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const refreshTokenSha = hashToken(refreshToken);

    await client.query(
      `INSERT INTO refresh_tokens (user_id, device_id, token_hash, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
      [user.id, device.id, refreshTokenSha]
    );

    await client.query("COMMIT");

    return {
      user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at },
      device: { id: device.id, name: device.name, platform: device.platform },
      accessToken,
      refreshToken,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    if (error.code === "23505") { // unique violation
      throw new Error("EMAIL_EXISTS");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function login(input: LoginInput) {
  const userResult = await pool.query(
    "SELECT id, email, password_hash, plan, encrypted_vault_key, created_at FROM users WHERE email = $1",
    [input.email]
  );

  if (userResult.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = userResult.rows[0];
  const validPassword = await bcrypt.compare(input.password, user.password_hash);
  if (!validPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Get or create device
  let device;
  if (input.deviceId) {
    const deviceResult = await pool.query(
      "SELECT id, name, platform FROM devices WHERE id = $1 AND user_id = $2",
      [input.deviceId, user.id]
    );
    device = deviceResult.rows[0];
    if (!device) throw new Error("DEVICE_NOT_FOUND");
  } else if (input.deviceName && input.platform && input.publicKey) {
    const deviceResult = await pool.query(
      `INSERT INTO devices (user_id, name, platform, public_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, platform`,
      [user.id, input.deviceName, input.platform, input.publicKey]
    );
    device = deviceResult.rows[0];
  } else {
    throw new Error("DEVICE_REQUIRED");
  }

  const accessToken = jwt.sign(
    { userId: user.id, deviceId: device.id },
    JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenSha = hashToken(refreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, device_id, token_hash, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 days')`,
    [user.id, device.id, refreshTokenSha]
  );

  return {
    user: { id: user.id, email: user.email, plan: user.plan, createdAt: user.created_at },
    device: { id: device.id, name: device.name, platform: device.platform },
    accessToken,
    refreshToken,
    encryptedVaultKey: user.encrypted_vault_key.toString("base64"),
  };
}

export async function refreshAccessToken(refreshToken: string) {
  // O(1) lookup via SHA-256 hash instead of O(n) bcrypt scan
  const tokenSha = hashToken(refreshToken);
  const result = await pool.query(
    "SELECT id, user_id, device_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()",
    [tokenSha]
  );

  if (result.rows.length === 0) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const row = result.rows[0];
  const accessToken = jwt.sign(
    { userId: row.user_id, deviceId: row.device_id },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
  return { accessToken };
}

export async function logout(userId: string, deviceId: string) {
  await pool.query(
    "DELETE FROM refresh_tokens WHERE user_id = $1 AND device_id = $2",
    [userId, deviceId]
  );
}
