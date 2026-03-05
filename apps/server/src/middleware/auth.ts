import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export interface AuthRequest extends Request {
  userId?: string;
  deviceId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; deviceId: string };
    req.userId = decoded.userId;
    req.deviceId = decoded.deviceId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
