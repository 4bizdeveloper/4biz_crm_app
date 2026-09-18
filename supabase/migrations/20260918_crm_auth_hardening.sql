ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS password_salt text;
CREATE INDEX IF NOT EXISTS idx_leads_assigned_employee ON public.leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_sales ON public.leads(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_marketing ON public.leads(assigned_marketing_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON public.crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_department_tasks_assigned_to ON public.department_tasks(assigned_to);
