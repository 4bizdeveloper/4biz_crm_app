-- Applied to Supabase project spauzmapkowcufduuavq.
-- RLS intentionally remains disabled for this application.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_department ON public.leads(assigned_department);
CREATE INDEX IF NOT EXISTS idx_leads_marketing_assignment ON public.leads(assigned_marketing_id);
CREATE INDEX IF NOT EXISTS idx_leads_sales_assignment ON public.leads(assigned_sales_id);
CREATE INDEX IF NOT EXISTS idx_leads_high_conversion ON public.leads(is_high_conversion_probable) WHERE is_high_conversion_probable = true;
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_date ON public.leads(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_leads_call_scheduled_at ON public.leads(call_scheduled_at);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON public.invoices(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_department_tasks_department ON public.department_tasks(department);
CREATE INDEX IF NOT EXISTS idx_department_tasks_assigned_to ON public.department_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_department_tasks_scheduled_at ON public.department_tasks(scheduled_at);
