-- Multi-user schema. Idempotent: run on every startup (CREATE ... IF NOT EXISTS).
-- One owner per row via user_id; ownership is enforced in the backend (JWT 'sub').
-- gen_random_uuid() is built into Postgres 13+ (Neon) — no extension needed.

-- Accounts. We own auth (custom JWT), so this is the source of truth for identity.
CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

-- One profile per user. The resume data is freeform JSON (same shape as the old
-- profile.json) so the generation/match engine reads it unchanged.
CREATE TABLE IF NOT EXISTS profiles (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    data       jsonb NOT NULL,
    source     text NOT NULL DEFAULT 'manual',  -- latex | pdf | manual
    template   text,                            -- the user's LaTeX template (from Overleaf paste); NULL -> use default
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- Idempotent add for databases created before `template` existed.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS template text;

-- Landing-demo IP gate: one free generation per IP, then we force login.
CREATE TABLE IF NOT EXISTS demo_usage (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address inet UNIQUE NOT NULL,
    user_agent text,
    used_at    timestamptz NOT NULL DEFAULT now()
);

-- Landing-demo rate limit: caps AI calls (e.g. resume extraction) per IP per day,
-- so the public, unauthenticated demo can't run up the OpenAI bill before the
-- one-shot generation gate kicks in.
CREATE TABLE IF NOT EXISTS demo_rate (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address inet NOT NULL,
    day        date NOT NULL,
    count      int  NOT NULL DEFAULT 0,
    UNIQUE (ip_address, day)
);

-- Profile-chat daily cap (10 messages/day). One counter row per user per day.
CREATE TABLE IF NOT EXISTS chat_usage (
    id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    day     date NOT NULL,
    count   int  NOT NULL DEFAULT 0,
    UNIQUE (user_id, day)
);

-- Generation history (minimal): the company and the score already computed during
-- the match step. No LaTeX, no PDF, no recomputed score.
CREATE TABLE IF NOT EXISTS resumes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company    text NOT NULL DEFAULT '',
    score      int,
    created_at timestamptz NOT NULL DEFAULT now()
);
