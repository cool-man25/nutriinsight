-- Simple migration: Create Users and Uploads tables

-- Ensure pgcrypto extension is available for gen_random_uuid() (for PostgreSQL < 13)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "Users" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid (),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
-- Create unique index on email (explicit, though UNIQUE constraint already creates one)
CREATE UNIQUE INDEX IF NOT EXISTS "Users_email_unique" ON "Users" ("email");