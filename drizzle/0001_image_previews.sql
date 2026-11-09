ALTER TABLE "media_files" ADD COLUMN IF NOT EXISTS "preview_data" bytea;
--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "preview_data" bytea;
