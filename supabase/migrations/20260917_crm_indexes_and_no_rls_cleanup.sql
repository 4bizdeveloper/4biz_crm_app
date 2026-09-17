-- Keep RLS disabled as explicitly requested; remove orphaned policies that only create advisor noise.
DROP POLICY IF EXISTS "Allow all operations for employees" ON public.employees;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.leads;
DROP POLICY IF EXISTS dept_head_leads ON public.leads;
DROP POLICY IF EXISTS employee_leads ON public.leads;
DROP POLICY IF EXISTS super_admin_all_leads ON public.leads;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead_id ON public.crm_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_created_by ON public.crm_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_department_tasks_lead_id ON public.department_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_dept_head ON public.leads(assigned_dept_head_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_employee ON public.leads(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_employee ON public.lead_activities(employee_id);
