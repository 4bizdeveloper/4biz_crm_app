ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "normalized_phone" TEXT;

UPDATE "leads"
SET "normalized_phone" = NULLIF(
  regexp_replace(
    COALESCE(
      NULLIF("phone", ''),
      NULLIF("mobile_number", ''),
      NULLIF("alternative_number", ''),
      NULLIF("whatsapp_number", ''),
      ''
    ),
    '\D',
    '',
    'g'
  ),
  ''
)
WHERE "normalized_phone" IS NULL;

CREATE INDEX IF NOT EXISTS "idx_leads_normalized_phone"
  ON "leads" ("normalized_phone");
