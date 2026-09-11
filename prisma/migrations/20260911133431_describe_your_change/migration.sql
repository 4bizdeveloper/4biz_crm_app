-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('New', 'Assigned', 'Contacted', 'Follow-up', 'Qualified', 'Converted', 'Disqualified');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('None', 'Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Unpaid', 'Partial', 'Paid');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('Hot', 'Warm', 'Cold');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Planning', 'In Progress', 'Testing', 'Completed', 'On Hold');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('Open', 'In Progress', 'Resolved', 'Closed');

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "value" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phone" TEXT,
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

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "client_name" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "budget" DECIMAL NOT NULL DEFAULT 0,
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATE,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'Planning',

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "assigned_to" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" "TicketPriority" NOT NULL DEFAULT 'Medium',
    "status" "TicketStatus" NOT NULL DEFAULT 'Open',

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);
