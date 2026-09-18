import { NextResponse } from 'next/server';
import { getAuthContext, canAssignLeads } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
 try {
  const ctx=await getAuthContext(); if(!ctx.employeeId&&!ctx.isAdmin)return NextResponse.json({error:'Unauthorized'},{status:401}); if(!canAssignLeads(ctx))return NextResponse.json({error:'Only administrators can assign leads'},{status:403});
  const {leadId,assignedDepartment,assignedEmployeeId,assignedDeptHeadId}=await request.json(); if(!leadId)return NextResponse.json({error:'leadId is required'},{status:400});
  const {data:lead,error:findError}=await supabase.from('leads').select('id,assigned_department').eq('id',leadId).single(); if(findError||!lead)return NextResponse.json({error:'Lead not found'},{status:404});
  if(!ctx.isAdmin&&assignedDepartment&&assignedDepartment!==ctx.department)return NextResponse.json({error:'You can only assign leads within your department'},{status:403});
  const updateData:Record<string,unknown>={}; if(assignedDepartment)updateData.assigned_department=assignedDepartment; if(assignedDeptHeadId!==undefined)updateData.assigned_dept_head_id=assignedDeptHeadId||null;
  if(assignedEmployeeId!==undefined){updateData.assigned_employee_id=assignedEmployeeId||null;if(lead.assigned_department==='Sales')updateData.assigned_sales_id=assignedEmployeeId||null;if(lead.assigned_department==='Marketing')updateData.assigned_marketing_id=assignedEmployeeId||null;}
  if(assignedEmployeeId)updateData.status='Assigned'; updateData.last_activity_at=new Date().toISOString();
  const {data,error}=await supabase.from('leads').update(updateData).eq('id',leadId).select('*').single(); if(error)return NextResponse.json({error:error.message},{status:500});
  await supabase.from('lead_activities').insert({lead_id:leadId,employee_id:ctx.employeeId,department:ctx.department,activity_type:'assigned',details:JSON.stringify(updateData)});
  return NextResponse.json({success:true,data});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Assignment failed'},{status:500});}
}
