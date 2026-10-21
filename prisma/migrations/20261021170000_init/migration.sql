-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('None', 'Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('HR', 'Finance', 'Marketing', 'Sales', 'Operations');

-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('Admin', 'Manager', 'Sales', 'Support', 'Developer');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Active', 'OnLeave', 'Terminated');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('Hot', 'Warm', 'Cold');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Unpaid', 'Partial', 'Paid');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Planning', 'In Progress', 'Testing', 'Completed', 'On Hold');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SuperAdmin', 'DeptHead', 'Employee');

-- CreateTable
CREATE TABLE "crm_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID,
    "department" "DepartmentType" NOT NULL,
    "assigned_to" UUID,
    "created_by" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "task_type" TEXT NOT NULL DEFAULT 'Follow-up',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "scheduled_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "department_id" UUID NOT NULL,
    "module_key" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "description" TEXT,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" "DepartmentType" NOT NULL,
    "assigned_to" UUID,
    "lead_id" UUID,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "department" TEXT,
    "job_title" TEXT,
    "role" "EmployeeRole" NOT NULL DEFAULT 'Sales',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'Active',
    "hire_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_role" "UserRole" NOT NULL DEFAULT 'Employee',
    "department_type" "DepartmentType" NOT NULL DEFAULT 'Sales',
    "avatar_url" TEXT,
    "password" TEXT NOT NULL DEFAULT 'changeMe123',
    "reports_to_id" UUID,
    "employee_code" TEXT,
    "work_location" TEXT,
    "branch" TEXT,
    "joined_at" DATE,
    "notes" TEXT,
    "password_hash" TEXT,
    "password_salt" TEXT,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID,
    "project_id" UUID,
    "client_name" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'Draft',
    "due_date" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "employee_id" UUID,
    "department" "DepartmentType",
    "activity_type" TEXT NOT NULL,
    "subject" TEXT,
    "details" TEXT,
    "activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_pipeline_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "changed_by" UUID,
    "from_status" TEXT,
    "to_status" TEXT,
    "from_marketing_stage" TEXT,
    "to_marketing_stage" TEXT,
    "from_sales_stage" TEXT,
    "to_sales_stage" TEXT,
    "from_department" TEXT,
    "to_department" TEXT,
    "from_assigned_employee" UUID,
    "to_assigned_employee" UUID,
    "note" TEXT,
    "changed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_pipeline_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "value" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
    "normalized_phone" TEXT,
    "source" TEXT NOT NULL DEFAULT 'Website',
    "notes" TEXT,
    "assigned_to" TEXT,
    "requirements" TEXT,
    "campaign_name" TEXT,
    "interactions" JSONB NOT NULL DEFAULT '[]',
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "documents" JSONB NOT NULL DEFAULT '[]',
    "quotation_details" JSONB NOT NULL DEFAULT '{}',
    "discount_pct" DECIMAL NOT NULL DEFAULT 0,
    "handover_notes" TEXT,
    "contact_info" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "job_title" TEXT,
    "department" TEXT,
    "secondary_email" TEXT,
    "mobile_number" TEXT,
    "alternative_number" TEXT,
    "whatsapp_number" TEXT,
    "preferred_contact_method" TEXT NOT NULL DEFAULT 'Email',
    "preferred_language" TEXT NOT NULL DEFAULT 'English',
    "contact_time_preference" TEXT,
    "country" TEXT,
    "emirate_state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "time_zone" TEXT NOT NULL DEFAULT 'UTC',
    "company_website" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "number_of_employees" INTEGER NOT NULL DEFAULT 0,
    "annual_revenue_range" TEXT,
    "business_type" TEXT,
    "company_location" TEXT,
    "vat_trn_number" TEXT,
    "customer_type" TEXT NOT NULL DEFAULT 'New Prospect',
    "parent_company" TEXT,
    "linkedin_company_url" TEXT,
    "interested_service" TEXT,
    "sub_service" TEXT,
    "product_category" TEXT,
    "requirement_description" TEXT,
    "main_pain_point" TEXT,
    "expected_solution" TEXT,
    "estimated_budget" DECIMAL NOT NULL DEFAULT 0,
    "expected_purchase_date" DATE,
    "project_timeline" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'Medium',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "project_location" TEXT,
    "existing_vendor" TEXT,
    "competitors_considered" TEXT,
    "additional_requirements" TEXT,
    "sub_source" TEXT,
    "campaign_id" TEXT,
    "ad_set" TEXT,
    "ad_name" TEXT,
    "keyword" TEXT,
    "landing_page" TEXT,
    "referral_url" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "utm_content" TEXT,
    "utm_term" TEXT,
    "first_touch_source" TEXT,
    "latest_touch_source" TEXT,
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "branch" TEXT NOT NULL DEFAULT 'Main Branch',
    "team" TEXT NOT NULL DEFAULT 'Sales Team',
    "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follow_up_date" TIMESTAMPTZ(6),
    "first_response_time_minutes" INTEGER NOT NULL DEFAULT 0,
    "status" "LeadStatus" NOT NULL DEFAULT 'New',
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'None',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'Unpaid',
    "lead_temperature" "LeadTemperature" NOT NULL DEFAULT 'Warm',
    "assigned_department" "DepartmentType" DEFAULT 'Sales',
    "assigned_dept_head_id" UUID,
    "assigned_employee_id" UUID,
    "is_high_conversion_probable" BOOLEAN NOT NULL DEFAULT false,
    "marketing_notes" TEXT,
    "sales_notes" TEXT,
    "call_scheduled_at" TIMESTAMPTZ(6),
    "assigned_marketing_id" UUID,
    "assigned_sales_id" UUID,
    "conversion_probability" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "marketing_pipeline_stage" TEXT NOT NULL DEFAULT 'New',
    "sales_pipeline_stage" TEXT NOT NULL DEFAULT 'Qualification',
    "next_action" TEXT,
    "next_action_at" TIMESTAMPTZ(6),
    "last_contacted_at" TIMESTAMPTZ(6),
    "qualified_at" TIMESTAMPTZ(6),
    "converted_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMPTZ(6),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_name" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'Planning',
    "lead_id" UUID,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "TicketPriority" NOT NULL DEFAULT 'Medium',
    "status" "TicketStatus" NOT NULL DEFAULT 'Open',

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_crm_tasks_assigned_schedule" ON "crm_tasks"("assigned_to", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_crm_tasks_assigned_to" ON "crm_tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_crm_tasks_created_by" ON "crm_tasks"("created_by");

-- CreateIndex
CREATE INDEX "idx_crm_tasks_department_schedule" ON "crm_tasks"("department", "scheduled_at");

-- CreateIndex
CREATE INDEX "idx_crm_tasks_lead_id" ON "crm_tasks"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_modules_department_id_module_key_key" ON "department_modules"("department_id", "module_key");

-- CreateIndex
CREATE INDEX "idx_department_tasks_assigned_to" ON "department_tasks"("assigned_to");

-- CreateIndex
CREATE INDEX "idx_department_tasks_department" ON "department_tasks"("department");

-- CreateIndex
CREATE INDEX "idx_department_tasks_lead_id" ON "department_tasks"("lead_id");

-- CreateIndex
CREATE INDEX "idx_department_tasks_scheduled_at" ON "department_tasks"("scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "idx_employees_reports_to" ON "employees"("reports_to_id");

-- CreateIndex
CREATE INDEX "idx_invoices_created_by" ON "invoices"("created_by");

-- CreateIndex
CREATE INDEX "idx_invoices_lead_id" ON "invoices"("lead_id");

-- CreateIndex
CREATE INDEX "idx_invoices_project_id" ON "invoices"("project_id");

-- CreateIndex
CREATE INDEX "idx_lead_activities_employee" ON "lead_activities"("employee_id");

-- CreateIndex
CREATE INDEX "idx_lead_activities_lead_at" ON "lead_activities"("lead_id", "activity_at" DESC);

-- CreateIndex
CREATE INDEX "idx_lead_pipeline_history_changed_by" ON "lead_pipeline_history"("changed_by");

-- CreateIndex
CREATE INDEX "idx_lead_pipeline_history_lead_changed_at" ON "lead_pipeline_history"("lead_id", "changed_at" DESC);

-- CreateIndex
CREATE INDEX "idx_leads_assigned_department" ON "leads"("assigned_department");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_dept_head" ON "leads"("assigned_dept_head_id");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_employee" ON "leads"("assigned_employee_id");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_marketing" ON "leads"("assigned_marketing_id");

-- CreateIndex
CREATE INDEX "idx_leads_assigned_sales" ON "leads"("assigned_sales_id");

-- CreateIndex
CREATE INDEX "idx_leads_call_scheduled_at" ON "leads"("call_scheduled_at");

-- CreateIndex
CREATE INDEX "idx_leads_conversion_probability" ON "leads"("conversion_probability" DESC);

-- CreateIndex
CREATE INDEX "idx_leads_follow_up_date" ON "leads"("follow_up_date");

-- CreateIndex
CREATE INDEX "idx_leads_high_conversion" ON "leads"("is_high_conversion_probable") WHERE (is_high_conversion_probable = true);

-- CreateIndex
CREATE INDEX "idx_leads_marketing_assignment" ON "leads"("assigned_marketing_id");

-- CreateIndex
CREATE INDEX "idx_leads_marketing_stage" ON "leads"("marketing_pipeline_stage");

-- CreateIndex
CREATE INDEX "idx_leads_next_action_at" ON "leads"("next_action_at");

-- CreateIndex
CREATE INDEX "idx_leads_sales_assignment" ON "leads"("assigned_sales_id");

-- CreateIndex
CREATE INDEX "idx_leads_sales_stage" ON "leads"("sales_pipeline_stage");

-- CreateIndex
CREATE INDEX "idx_leads_updated_at" ON "leads"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "idx_leads_normalized_phone" ON "leads"("normalized_phone");

-- CreateIndex
CREATE INDEX "idx_projects_lead_id" ON "projects"("lead_id");

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "department_modules" ADD CONSTRAINT "department_modules_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "department_tasks" ADD CONSTRAINT "department_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "department_tasks" ADD CONSTRAINT "department_tasks_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_reports_to_id_fkey" FOREIGN KEY ("reports_to_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_pipeline_history" ADD CONSTRAINT "lead_pipeline_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lead_pipeline_history" ADD CONSTRAINT "lead_pipeline_history_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_dept_head_id_fkey" FOREIGN KEY ("assigned_dept_head_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_marketing_id_fkey" FOREIGN KEY ("assigned_marketing_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_sales_id_fkey" FOREIGN KEY ("assigned_sales_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

