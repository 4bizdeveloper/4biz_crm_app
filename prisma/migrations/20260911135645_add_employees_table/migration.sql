-- CreateEnum
CREATE TYPE "EmployeeRole" AS ENUM ('Admin', 'Manager', 'Sales', 'Support', 'Developer');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('Active', 'OnLeave', 'Terminated');

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
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

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");
