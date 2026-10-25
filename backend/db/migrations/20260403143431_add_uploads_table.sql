-- Migration: Add Uploads Table
-- This migration creates the Uploads table for the file-upload capability

CREATE TABLE IF NOT EXISTS "Uploads" (
    "id" TEXT PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
    "upload_id" TEXT NOT NULL UNIQUE,
    "file_name" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "file_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "Uploads_user_id_idx" ON "Uploads"("user_id");

COMMENT ON TABLE "Uploads" IS 'Stores uploaded file metadata for authenticated users';
