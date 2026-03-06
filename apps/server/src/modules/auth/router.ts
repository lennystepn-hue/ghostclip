import { Router, type Router as RouterType } from "express";
import { register, login, refreshAccessToken, logout } from "./service";
import { registerSchema, loginSchema } from "@ghostclip/shared";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { loginLimiter, registerLimiter, refreshLimiter } from "../../middleware/rate-limit";
import { pool } from "../../database/connection";

const router: RouterType = Router();

router.post("/register", registerLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const result = await register({
      email: parsed.email,
      password: parsed.password,
      encryptedVaultKey: req.body.encryptedVaultKey,
      deviceName: req.body.deviceName,
      platform: req.body.platform,
      publicKey: req.body.publicKey,
    });
    res.status(201).json(result);
  } catch (error: any) {
    if (error.message === "EMAIL_EXISTS") {
      return res.status(409).json({ error: "Email already registered" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const result = await login({
      email: parsed.email,
      password: parsed.password,
      deviceId: req.body.deviceId,
      deviceName: req.body.deviceName,
      platform: req.body.platform,
      publicKey: req.body.publicKey,
    });
    res.json(result);
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    if (error.message === "DEVICE_NOT_FOUND") {
      return res.status(404).json({ error: "Device not found" });
    }
    if (error.message === "DEVICE_REQUIRED") {
      return res.status(400).json({ error: "Device info required for new device" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ error: "Invalid input", details: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh", refreshLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });
    const result = await refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error: any) {
    if (error.message === "INVALID_REFRESH_TOKEN") {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/devices", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, platform, last_sync, created_at FROM devices WHERE user_id = $1 ORDER BY last_sync DESC NULLS LAST",
      [req.userId]
    );
    res.json({ devices: result.rows });
  } catch (error) {
    console.error("Devices error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", authMiddleware, async (req: AuthRequest, res) => {
  try {
    await logout(req.userId!, req.deviceId!);
    res.json({ message: "Logged out" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as authRouter };
