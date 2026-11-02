-- Accounting module for 4Biz CRM. Idempotent and compatible with existing invoices.
CREATE TABLE IF NOT EXISTS public.accounting_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('Asset','Liability','Equity','Revenue','Expense')),
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.accounting_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  tax_number text,
  address text,
  payment_terms text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.accounting_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_number text NOT NULL UNIQUE,
  vendor_id uuid REFERENCES public.accounting_vendors(id) ON DELETE SET NULL,
  category_account_id uuid REFERENCES public.accounting_accounts(id),
  description text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  currency text NOT NULL DEFAULT 'AED',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Paid','Rejected')),
  payment_method text,
  reference text,
  notes text,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.accounting_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method text NOT NULL DEFAULT 'Bank Transfer',
  reference text,
  notes text,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.accounting_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number text NOT NULL UNIQUE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft','Posted','Void')),
  currency text NOT NULL DEFAULT 'AED',
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.accounting_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.accounting_journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounting_accounts(id) ON DELETE RESTRICT,
  description text,
  debit numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  CHECK ((debit = 0 AND credit > 0) OR (credit = 0 AND debit > 0))
);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date ON public.accounting_expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_status ON public.accounting_expenses(status);
CREATE INDEX IF NOT EXISTS idx_accounting_payments_invoice ON public.accounting_payments(invoice_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_date ON public.accounting_journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry ON public.accounting_journal_lines(journal_entry_id);
INSERT INTO public.accounting_accounts(code,name,account_type,description,is_system) VALUES
('1000','Cash & Bank','Asset','Cash and bank balances',true),
('1100','Accounts Receivable','Asset','Amounts owed by customers',true),
('1200','Input Tax Recoverable','Asset','Recoverable input tax',true),
('2000','Accounts Payable','Liability','Amounts owed to vendors',true),
('2100','Output Tax Payable','Liability','Tax collected and payable',true),
('3000','Owner Equity','Equity','Owner capital and retained earnings',true),
('4000','Sales Revenue','Revenue','Revenue from CRM customers',true),
('5000','Operating Expenses','Expense','General operating expenses',true)
ON CONFLICT (code) DO NOTHING;

-- Posting is atomic and rejects unbalanced entries or entries with fewer than two lines.
CREATE OR REPLACE FUNCTION public.post_accounting_journal(p_entry_id uuid)
RETURNS public.accounting_journal_entries
LANGUAGE plpgsql
SECURITY INVOKER
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
