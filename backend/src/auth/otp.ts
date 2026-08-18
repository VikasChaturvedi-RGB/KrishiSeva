import crypto from "crypto";
import db from "../db";
import { smsProvider } from "../services/smsProvider";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function generateOtp(): string {
  // Uniform random 6-digit code, zero-padded. crypto.randomInt avoids modulo bias.
  const n = crypto.randomInt(0, 10 ** OTP_LENGTH);
  return n.toString().padStart(OTP_LENGTH, "0");
}

function hashOtp(otp: string, mobileNumber: string): string {
  // Salted with the mobile number so two users never share a comparable hash.
  return crypto.createHash("sha256").update(`${mobileNumber}:${otp}`).digest("hex");
}

function isValidIndianMobile(mobileNumber: string): boolean {
  // Accepts +91XXXXXXXXXX or 10-digit local form starting 6-9 (TRAI numbering plan).
  return /^(\+91)?[6-9]\d{9}$/.test(mobileNumber);
}

export function normalizeMobile(mobileNumber: string): string {
  const digits = mobileNumber.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return `+91${last10}`;
}

export async function requestOtp(rawMobileNumber: string, purpose: "login" | "registration" = "login") {
  if (!isValidIndianMobile(rawMobileNumber)) {
    throw new Error("INVALID_MOBILE_NUMBER");
  }
  const mobileNumber = normalizeMobile(rawMobileNumber);

  const recent = db
    .prepare(
      `SELECT created_at FROM otp_codes WHERE mobile_number = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(mobileNumber) as { created_at: string } | undefined;

  if (recent) {
    const secondsSinceLast = (Date.now() - new Date(recent.created_at + "Z").getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      throw new Error("OTP_COOLDOWN_ACTIVE");
    }
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp, mobileNumber);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO otp_codes (mobile_number, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?)`
  ).run(mobileNumber, otpHash, purpose, expiresAt);

  await smsProvider.sendSms(
    mobileNumber,
    `${otp} is your Krishi Swasthya Sahayak login code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share this code with anyone.`
  );

  return { mobileNumber, expiresInMinutes: OTP_TTL_MINUTES };
}

export function verifyOtp(rawMobileNumber: string, otp: string): { mobileNumber: string } {
  const mobileNumber = normalizeMobile(rawMobileNumber);

  const record = db
    .prepare(
      `SELECT id, otp_hash, attempts, max_attempts, expires_at, consumed_at
       FROM otp_codes WHERE mobile_number = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(mobileNumber) as
    | { id: number; otp_hash: string; attempts: number; max_attempts: number; expires_at: string; consumed_at: string | null }
    | undefined;

  if (!record) throw new Error("OTP_NOT_REQUESTED");
  if (record.consumed_at) throw new Error("OTP_ALREADY_USED");
  if (new Date(record.expires_at + "Z").getTime() < Date.now()) throw new Error("OTP_EXPIRED");
  if (record.attempts >= record.max_attempts) throw new Error("OTP_MAX_ATTEMPTS_EXCEEDED");

  const suppliedHash = hashOtp(otp, mobileNumber);
  if (suppliedHash !== record.otp_hash) {
    db.prepare(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?`).run(record.id);
    throw new Error("OTP_INCORRECT");
  }

  db.prepare(`UPDATE otp_codes SET consumed_at = datetime('now') WHERE id = ?`).run(record.id);
  return { mobileNumber };
}
