-- Lock accounting data behind the server-side service role and tighten ledger execution.
ALTER TABLE public.accounting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journal_lines ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.accounting_accounts, public.accounting_vendors, public.accounting_expenses,
  public.accounting_payments, public.accounting_journal_entries, public.accounting_journal_lines
  FROM anon, authenticated;
GRANT ALL ON public.accounting_accounts, public.accounting_vendors, public.accounting_expenses,
  public.accounting_payments, public.accounting_journal_entries, public.accounting_journal_lines
  TO service_role;

CREATE INDEX IF NOT EXISTS idx_accounting_expenses_vendor ON public.accounting_expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_account ON public.accounting_expenses(category_account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_created_by ON public.accounting_expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_accounting_payments_created_by ON public.accounting_payments(created_by);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_created_by ON public.accounting_journal_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_account ON public.accounting_journal_lines(account_id);

CREATE OR REPLACE FUNCTION public.post_accounting_journal(p_entry_id uuid)
RETURNS public.accounting_journal_entries
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entry public.accounting_journal_entries;
  v_count integer;
  v_debit numeric(14,2);
  v_credit numeric(14,2);
BEGIN
  SELECT * INTO v_entry FROM public.accounting_journal_entries WHERE id = p_entry_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Journal entry not found'; END IF;
  IF v_entry.status <> 'Draft' THEN RAISE EXCEPTION 'Only draft journal entries can be posted'; END IF;
  SELECT count(*), COALESCE(sum(debit),0), COALESCE(sum(credit),0)
    INTO v_count, v_debit, v_credit
    FROM public.accounting_journal_lines WHERE journal_entry_id = p_entry_id;
  IF v_count < 2 THEN RAISE EXCEPTION 'A journal entry requires at least two lines'; END IF;
  IF v_debit <= 0 OR v_debit <> v_credit THEN RAISE EXCEPTION 'Journal entry debits and credits must be equal and greater than zero'; END IF;
  UPDATE public.accounting_journal_entries SET status='Posted', posted_at=now() WHERE id=p_entry_id RETURNING * INTO v_entry;
  RETURN v_entry;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.post_accounting_journal(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_accounting_journal(uuid) TO service_role;
