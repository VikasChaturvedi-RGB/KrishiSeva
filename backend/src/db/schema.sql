-- Krishi Swasthya Sahayak — SQLite schema (WAL mode)
-- RBAC: role separates Farmer / Clinic / Admin-Agronomist per README.
-- DPDP Act 2023: consent_given_at captures explicit OTP-verified consent for agronomic data processing.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile_number     TEXT NOT NULL UNIQUE,           -- E.164-ish, e.g. +91XXXXXXXXXX
  full_name         TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'hi',    -- one of languages.json codes
  state_code        TEXT,                           -- one of locations-india.json codes
  district          TEXT,
  role              TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'clinic', 'admin')),
  consent_given_at  TEXT,                           -- ISO timestamp; NULL until OTP-verified consent captured
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  mobile_number     TEXT NOT NULL,
  otp_hash          TEXT NOT NULL,                  -- never store the raw OTP
  purpose           TEXT NOT NULL DEFAULT 'login' CHECK (purpose IN ('login', 'registration')),
  attempts          INTEGER NOT NULL DEFAULT 0,
  max_attempts      INTEGER NOT NULL DEFAULT 5,
  expires_at        TEXT NOT NULL,
  consumed_at       TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_codes(mobile_number);

CREATE TABLE IF NOT EXISTS sessions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,            -- hash of the JWT, so a leaked DB row can't be replayed as-is
  device_label      TEXT,
  issued_at         TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at        TEXT NOT NULL,                   -- issued_at + SESSION_TTL_DAYS (default 45)
  revoked_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS diagnoses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crop_id           TEXT NOT NULL,                   -- knowledge-base.json crop id
  organ             TEXT CHECK (organ IN ('LEAF','STEM','FRUIT','ROOT','FLOWER', NULL)),
  input_mode        TEXT NOT NULL CHECK (input_mode IN ('symptom_checklist','photo')),
  symptoms_json      TEXT,                           -- JSON array of selected symptom keys, if checklist mode
  image_ref         TEXT,                            -- storage reference, if photo mode (never store raw image in SQLite)
  state_code        TEXT,
  acreage           REAL,
  plant_health_index INTEGER,                        -- 0-100
  matched_issues_json TEXT NOT NULL,                 -- JSON array of {type, id, name, confidence}
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON diagnoses(user_id);
