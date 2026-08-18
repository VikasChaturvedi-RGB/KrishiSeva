import { Router } from "express";
import rateLimit from "express-rate-limit";
import db from "../db";
import { requestOtp, verifyOtp, normalizeMobile } from "../auth/otp";
import { issueSession, revokeSession } from "../auth/session";
import { requireAuth, AuthedRequest } from "../auth/middleware";

export const authRouter = Router();

// Throttle OTP requests per-IP to slow down abuse of the SMS provider / phone numbers.
const otpRequestLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const otpVerifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

/**
 * POST /auth/otp/request
 * body: { mobileNumber: string, purpose?: "login" | "registration" }
 */
authRouter.post("/otp/request", otpRequestLimiter, async (req, res) => {
  const { mobileNumber, purpose } = req.body || {};
  if (!mobileNumber) return res.status(400).json({ error: "MOBILE_NUMBER_REQUIRED" });

  try {
    const result = await requestOtp(mobileNumber, purpose === "registration" ? "registration" : "login");
    res.json({ ok: true, ...result });
  } catch (e: any) {
    const knownErrors = ["INVALID_MOBILE_NUMBER", "OTP_COOLDOWN_ACTIVE"];
    const code = knownErrors.includes(e.message) ? e.message : "OTP_REQUEST_FAILED";
    res.status(400).json({ error: code });
  }
});

/**
 * POST /auth/otp/verify
 * body: { mobileNumber, otp, languagePreference?, stateCode?, district?, deviceLabel? }
 * On first-ever verify for a mobile number, this also creates the user record (registration),
 * capturing DPDP-relevant consent_given_at at the moment of successful OTP verification.
 * Returns a session token valid for SESSION_TTL_DAYS (45 by default) — see auth/session.ts.
 */
authRouter.post("/otp/verify", otpVerifyLimiter, async (req, res) => {
  const { mobileNumber, otp, languagePreference, stateCode, district, deviceLabel } = req.body || {};
  if (!mobileNumber || !otp) return res.status(400).json({ error: "MOBILE_NUMBER_AND_OTP_REQUIRED" });

  try {
    const { mobileNumber: normalized } = verifyOtp(mobileNumber, otp);

    let user = db.prepare(`SELECT * FROM users WHERE mobile_number = ?`).get(normalized) as any;

    if (!user) {
      const info = db
        .prepare(
          `INSERT INTO users (mobile_number, preferred_language, state_code, district, consent_given_at)
           VALUES (?, ?, ?, ?, datetime('now'))`
        )
        .run(normalized, languagePreference || "hi", stateCode || null, district || null);
      user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(info.lastInsertRowid);
    } else if (stateCode || languagePreference) {
      // Allow location/language to be refreshed on a later login without a separate endpoint.
      db.prepare(
        `UPDATE users SET state_code = COALESCE(?, state_code), district = COALESCE(?, district),
         preferred_language = COALESCE(?, preferred_language), updated_at = datetime('now') WHERE id = ?`
      ).run(stateCode || null, district || null, languagePreference || null, user.id);
      user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(user.id);
    }

    const session = issueSession(
      { id: user.id, mobile_number: user.mobile_number, role: user.role },
      deviceLabel
    );

    res.json({
      ok: true,
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        preferredLanguage: user.preferred_language,
        stateCode: user.state_code,
        district: user.district,
        role: user.role,
      },
    });
  } catch (e: any) {
    const knownErrors = [
      "OTP_NOT_REQUESTED",
      "OTP_ALREADY_USED",
      "OTP_EXPIRED",
      "OTP_MAX_ATTEMPTS_EXCEEDED",
      "OTP_INCORRECT",
    ];
    const code = knownErrors.includes(e.message) ? e.message : "OTP_VERIFY_FAILED";
    res.status(400).json({ error: code });
  }
});

/** GET /auth/session — cheap check the app can call on launch to see if the stored 45-day token is still good. */
authRouter.get("/session", requireAuth, (req: AuthedRequest, res) => {
  res.json({ ok: true, user: req.user });
});

/** POST /auth/logout — revokes just this device's session; the 45-day token stops working immediately. */
authRouter.post("/logout", requireAuth, (req, res) => {
  const header = req.headers.authorization || "";
  const token = header.slice(7);
  revokeSession(token);
  res.json({ ok: true });
});

/**
 * POST /auth/location (auth required)
 * body: { stateCode: string, district?: string }
 * Persists the state/district chosen on the onboarding "select your state" screen against the
 * account, so it survives a fresh login on another device — not just the local session that
 * picked it. Reuses the same COALESCE-update shape as the refresh-on-login path in /otp/verify.
 */
authRouter.post("/location", requireAuth, (req: AuthedRequest, res) => {
  const { stateCode, district } = req.body || {};
  if (!stateCode) return res.status(400).json({ error: "STATE_CODE_REQUIRED" });

  db.prepare(
    `UPDATE users SET state_code = ?, district = COALESCE(?, district), updated_at = datetime('now') WHERE id = ?`
  ).run(stateCode, district || null, req.user!.id);

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user!.id) as any;
  res.json({
    ok: true,
    user: {
      id: user.id,
      mobileNumber: user.mobile_number,
      preferredLanguage: user.preferred_language,
      stateCode: user.state_code,
      district: user.district,
      role: user.role,
    },
  });
});
