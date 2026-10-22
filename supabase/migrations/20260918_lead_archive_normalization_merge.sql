-- Archive / normalisation / merge support for leads.
-- RLS intentionally remains disabled for this application.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_reason text,
  ADD COLUMN IF NOT EXISTS merged_into_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS normalized_email text,
  ADD COLUMN IF NOT EXISTS normalized_phone text,
  ADD COLUMN IF NOT EXISTS normalized_company text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'AED';

-- Backfill normalised columns from existing rows.
UPDATE public.leads
SET normalized_email = lower(trim(email))
WHERE email IS NOT NULL AND normalized_email IS NULL;

UPDATE public.leads
SET normalized_phone = regexp_replace(
  regexp_replace(
    regexp_replace(coalesce(phone, mobile_number, ''), '^00', '+', ''),
    '[\s\-().]', '', 'g'
  ),
  '^([0-9])', '+\1', ''
)
WHERE (phone IS NOT NULL OR mobile_number IS NOT NULL) AND normalized_phone IS NULL;

UPDATE public.leads
SET normalized_company = lower(regexp_replace(
  regexp_replace(
    regexp_replace(coalesce(company, ''), '\y(l\.?l\.?c|fzco|fzc|fze|pjsc|pvt|inc|ltd|limited|llp|gmbh)\y\.?', '', 'gi'),
    '[^a-zA-Z0-9]+', ' ', 'g'
  ),
  '\s+', ' ', 'g'
))
WHERE company IS NOT NULL AND normalized_company IS NULL;

CREATE TABLE IF NOT EXISTS public.lead_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  duplicate_lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  merged_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  merge_notes text,
  merged_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_merges_primary ON public.lead_merges(primary_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_merges_duplicate ON public.lead_merges(duplicate_lead_id);

CREATE INDEX IF NOT EXISTS idx_leads_archived_at ON public.leads(archived_at);
CREATE INDEX IF NOT EXISTS idx_leads_merged_into ON public.leads(merged_into_id);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_email ON public.leads(normalized_email);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_phone ON public.leads(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_leads_normalized_company ON public.leads(normalized_company);
CREATE INDEX IF NOT EXISTS idx_leads_dedupe_email_company ON public.leads(normalized_email, normalized_company);

-- Safety: ensure partial index for high-conversion is untouched (existing).