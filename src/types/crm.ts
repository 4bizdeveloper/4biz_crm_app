// src/types/crm.ts
export enum Role { ADMIN='ADMIN', USER='USER', EMPLOYEE='EMPLOYEE', MANAGER='MANAGER' }
export type RoleType = Role;
export type DepartmentType = 'Marketing'|'Sales'|'Operations'|'HR'|'Finance';
export type LeadStatus = string;

export interface Lead {
 id:string; name:string; email:string; company?:string; value?:number; created_at:string; phone?:string; source?:string; notes?:string; assigned_to?:string|null; requirements?:string; campaign_name?:string; status:LeadStatus; payment_status?:string; assigned_department?:DepartmentType; assigned_dept_head_id?:string|null; assigned_employee_id?:string|null; is_high_conversion_probable?:boolean; marketing_notes?:string; sales_notes?:string; assigned_marketing_id?:string|null; assigned_sales_id?:string|null; follow_up_date?:string|null; call_scheduled_at?:string|null; lead_score?:number; lead_temperature?:'Hot'|'Warm'|'Cold'; last_activity_at?:string;
 [key:string]: unknown;
}
export interface Employee { id:string; first_name:string; last_name:string; email:string; phone?:string; department?:string; job_title?:string; role:string; status:string; user_role:string; department_type:DepartmentType; avatar_url?:string; hire_date:string; created_at:string; }
export interface Invoice { id:string; lead_id?:string|null; project_id?:string|null; client_name:string; amount:number; tax_amount:number; status:string; due_date:string; created_at:string; created_by?:string|null; }
export interface Project { id:string; client_name:string; project_name:string; budget:number; assigned_to?:string|null; created_at:string; start_date:string; due_date?:string|null; description?:string; status:string; }
export interface DepartmentTask { id:string; title:string; description?:string|null; department:DepartmentType; assigned_to?:string|null; lead_id?:string|null; scheduled_at:string; is_completed:boolean; created_at:string; }
export interface CRMFilterState { leadOwner:string; team:string; branch:string; source:string; campaign:string; status:string; service:string; country:string; temperature:string; minScore:number; maxScore:number; }
