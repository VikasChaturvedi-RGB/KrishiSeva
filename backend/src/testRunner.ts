/**
 * Dependency-free smoke tests. Run after `npm run build` via `npm run test`
 * (= `node dist/testRunner.js`). Uses a throwaway SQLite file so it never touches
 * real user data.
 */
process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "test-secret";
process.env.SMS_PROVIDER = "mock";

import db from "./db";
import { requestOtp, verifyOtp, normalizeMobile } from "./auth/otp";
import { issueSession, verifySession } from "./auth/session";
import { diagnose, getSignLibrary } from "./services/diagnosisEngine";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

async function run() {
  console.log("Krishi Swasthya Sahayak — backend smoke tests\n");

  console.log("normalizeMobile:");
  assert(normalizeMobile("9876543210") === "+919876543210", "bare 10-digit number is normalized with +91");
  assert(normalizeMobile("+91 98765 43210") === "+919876543210", "spaced +91 number is normalized");

  console.log("\nOTP flow:");
  const mobile = "9876543210";
  await requestOtp(mobile, "registration");
  const row = db
    .prepare(`SELECT otp_hash FROM otp_codes WHERE mobile_number = ? ORDER BY created_at DESC LIMIT 1`)
    .get(normalizeMobile(mobile)) as { otp_hash: string };
  assert(Boolean(row), "an OTP row was created after requestOtp");

  let wrongOtpRejected = false;
  try {
    verifyOtp(mobile, "000000");
  } catch (e: any) {
    wrongOtpRejected = e.message === "OTP_INCORRECT";
  }
  assert(wrongOtpRejected, "an incorrect OTP is rejected");

  console.log("\nSession issuance (45-day persistence):");
  const session = issueSession({ id: 1, mobile_number: normalizeMobile(mobile), role: "farmer" });
  const expiresInDays = (new Date(session.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  assert(expiresInDays > 44.9 && expiresInDays < 45.1, `session expiry is ~45 days out (got ${expiresInDays.toFixed(2)})`);
  const verified = verifySession(session.token);
  assert(verified !== null && verified.id === 1, "a freshly issued session verifies successfully");

  console.log("\nDiagnosis engine:");
  const signs = getSignLibrary();
  assert(signs.length > 10, `sign library has a reasonable vocabulary size (${signs.length} signs)`);

  const rustLikeSigns = ["holes_in_leaves", "dead_heart"];
  const stemBorerResult = diagnose("rice", rustLikeSigns);
  assert(
    stemBorerResult.matches.some((m) => m.name_en.toLowerCase().includes("stem borer")),
    "rice + {holes_in_leaves, dead_heart} surfaces yellow stem borer as a match"
  );
  assert(
    stemBorerResult.plantHealthIndex < 100,
    `plant health index drops below 100 when a match is found (got ${stemBorerResult.plantHealthIndex})`
  );

  const noSignsResult = diagnose("rice", []);
  assert(noSignsResult.plantHealthIndex === 100, "no signs selected => health index defaults to 100");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Smoke test runner crashed:", e);
  process.exit(1);
});
