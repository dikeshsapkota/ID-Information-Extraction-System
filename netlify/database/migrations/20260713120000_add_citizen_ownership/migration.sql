ALTER TABLE "citizens" ADD COLUMN "owner_id" text DEFAULT 'legacy-admin' NOT NULL;
CREATE INDEX "citizens_owner_id_idx" ON "citizens" ("owner_id");
