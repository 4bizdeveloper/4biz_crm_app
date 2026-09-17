-- Centralized multi-department CRM expansion. RLS remains disabled by explicit application requirement.

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.department_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  module_key text NOT NULL,
  module_name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(department_id, module_key)
);

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS reports_to_id uuid REFERENCES public.employees(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS employee_code text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS work_location text;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS joined_at date;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS conversion_probability numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS marketing_pipeline_stage text NOT NULL DEFAULT 'New';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sales_pipeline_stage text NOT NULL DEFAULT 'Qualification';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS next_action_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS qualified_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  department public."DepartmentType",
  activity_type text NOT NULL,
  subject text,
  details text,
  activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  department public."DepartmentType" NOT NULL,
  assigned_to uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'Follow-up',
  priority text NOT NULL DEFAULT 'Medium',
  scheduled_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.departments (code,name,description) VALUES
('HR','Human Resources','People, recruitment, attendance, leave and employee lifecycle'),
('FIN','Finance & Accounting','Invoices, receivables, payables, expenses and financial reporting'),
('MKT','Marketing','Lead qualification, campaigns, scoring and sales handover'),
('SAL','Sales','Pipeline, opportunities, follow-ups, quotations and conversion'),
('OPS','Operations','Projects, delivery, workflows, service and internal operations')
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description;

INSERT INTO public.department_modules (department_id,module_key,module_name,description)
SELECT d.id, v.module_key, v.module_name, v.description
FROM public.departments d
JOIN (VALUES
('HR','people','People & Employee Management','Employee directory, onboarding, leave and performance'),
('HR','recruitment','Recruitment','Candidates, interviews and hiring pipeline'),
('HR','attendance','Attendance & Leave','Attendance, leave requests and calendars'),
('FIN','invoices','Invoices & Receivables','Invoice lifecycle, payment status and receivables'),
('FIN','expenses','Expenses & Payables','Expenses, approvals and vendor payments'),
('FIN','reports','Financial Reports','Revenue, collections and management reporting'),
('MKT','lead_queue','Lead Qualification','Shared lead queue, scoring and qualification'),
('MKT','campaigns','Campaigns','Campaign attribution, sources and conversion analysis'),
('MKT','handover','Sales Handover','High-conversion lead handover to Sales'),
('SAL','pipeline','Sales Pipeline','Opportunity stages, status and forecasting'),
('SAL','activities','Follow-ups & Calls','Tasks, call scheduling and daily activity queue'),
('SAL','quotations','Quotations','Quotation preparation, approvals and conversion'),
('OPS','projects','Projects & Delivery','Project planning, execution and milestones'),
('OPS','tickets','Service Operations','Tickets, priorities and resolution tracking'),
('OPS','tasks','Operations Tasks','Department tasks and operational workflows')
) AS v(dept_code,module_key,module_name,description) ON d.code=v.dept_code
ON CONFLICT (department_id,module_key) DO UPDATE SET module_name=EXCLUDED.module_name, description=EXCLUDED.description;

CREATE INDEX IF NOT EXISTS idx_employees_reports_to ON public.employees(reports_to_id);
CREATE INDEX IF NOT EXISTS idx_leads_conversion_probability ON public.leads(conversion_probability DESC);
CREATE INDEX IF NOT EXISTS idx_leads_marketing_stage ON public.leads(marketing_pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_sales_stage ON public.leads(sales_pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_next_action_at ON public.leads(next_action_at);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_at ON public.lead_activities(lead_id, activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_schedule ON public.crm_tasks(assigned_to, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_department_schedule ON public.crm_tasks(department, scheduled_at);
