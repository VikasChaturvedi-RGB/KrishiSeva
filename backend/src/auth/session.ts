import jwt from "jsonwebtoken";
import crypto from "crypto";
import db from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 45);

export interface SessionUser {
  id: number;
  mobile_number: string;
  role: "farmer" | "clinic" | "admin";
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a session that stays valid for SESSION_TTL_DAYS (45 by default) without
 * requiring the user to re-enter an OTP, per the "persist login for 45 days" requirement.
 * The token itself carries the expiry (stateless verification), and a hash of it is also
 * stored server-side so a session can be individually revoked (e.g. "log out this device").
 */
export function issueSession(user: SessionUser, deviceLabel?: string): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    { sub: user.id, mobile: user.mobile_number, role: user.role },
    JWT_SECRET,
    { expiresIn: `${SESSION_TTL_DAYS}d` }
  );

  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, device_label, expires_at) VALUES (?, ?, ?, ?)`
  ).run(user.id, hashToken(token), deviceLabel || null, expiresAt.toISOString());

  return { token, expiresAt: expiresAt.toISOString() };
}

export function verifySession(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: number; mobile: string; role: SessionUser["role"] };

    const row = db
      .prepare(`SELECT revoked_at, expires_at FROM sessions WHERE token_hash = ?`)
      .get(hashToken(token)) as { revoked_at: string | null; expires_at: string } | undefined;

    if (!row) return null; // token not found server-side (e.g. after a DB reset) — reject
    if (row.revoked_at) return null;
    if (new Date(row.expires_at).getTime() < Date.now()) return null;

    return { id: payload.sub, mobile_number: payload.mobile, role: payload.role };
  } catch {
    return null;
  }
}

export function revokeSession(token: string): void {
  db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE token_hash = ?`).run(hashToken(token));
}

export function revokeAllSessionsForUser(userId: number): void {
  db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ? AND revoked_at IS NULL`).run(userId);
}
