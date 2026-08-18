import { Request, Response, NextFunction } from "express";
import { verifySession, SessionUser } from "./session";

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "AUTH_REQUIRED" });
  }
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: "SESSION_INVALID_OR_EXPIRED" });
  }
  req.user = user;
  next();
}

export function requireRole(...roles: Array<SessionUser["role"]>) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "FORBIDDEN_ROLE" });
    }
    next();
  };
}
