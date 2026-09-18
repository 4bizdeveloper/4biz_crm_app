import { NextResponse } from 'next/server';
import { getAuthContext, isDepartmentHead } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';

const writable = ['name','email','first_name','last_name','display_name','phone','mobile_number','whatsapp_number','company','company_website','job_title','department','country','emirate_state','city','address','source','sub_source','campaign_name','campaign_id','requirements','requirement_description','main_pain_point','expected_solution','interested_service','sub_service','product_category','estimated_budget','expected_purchase_date','project_timeline','urgency','quantity','project_location','existing_vendor','competitors_considered','additional_requirements','notes','marketing_notes','sales_notes','lead_score','lead_temperature','follow_up_date','call_scheduled_at','next_action','next_action_at','preferred_contact_method','preferred_language','contact_time_preference','status','assigned_department','assigned_dept_head_id','assigned_employee_id','assigned_marketing_id','assigned_sales_id','is_high_conversion_probable','conversion_probability','marketing_pipeline_stage','sales_pipeline_stage','branch','team','payment_status','approval_status'] as const;
const statusValues = ['New','Assigned','Contacted','Follow-up','Qualified','Converted','Disqualified'];
const assignmentFields = ['assigned_employee_id','assigned_sales_id','assigned_marketing_id','assigned_dept_head_id'];
function clean(body: Record<string, unknown>, allowAssignment: boolean) { const out: Record<string, unknown> = {}; for (const key of writable) if (key in body && (allowAssignment || !assignmentFields.includes(key))) out[key] = body[key] === '' ? null : body[key]; return out; }
function canManage(ctx: Awaited<ReturnType<typeof getAuthContext>>) { return ctx.isAdmin || isDepartmentHead(ctx); }
function employeeOwns(ctx: Awaited<ReturnType<typeof getAuthContext>>, lead: Record<string, unknown>) { return !!ctx.employeeId && [lead.assigned_employee_id, lead.assigned_sales_id, lead.assigned_marketing_id].includes(ctx.employeeId); }
function visibleTo(ctx: Awaited<ReturnType<typeof getAuthContext>>, lead: Record<string, unknown>) { return canManage(ctx) || employeeOwns(ctx, lead); }

export async function GET(request: Request) {
 const ctx=await getAuthContext(); if(!ctx.employeeId&&!ctx.isAdmin)return NextResponse.json({error:'Unauthorized'},{status:401});
 const sp=new URL(request.url).searchParams; let q=supabase.from('leads').select('*').order('last_activity_at',{ascending:false});
 if(!canManage(ctx)){q=q.or(`assigned_employee_id.eq.${ctx.employeeId},assigned_sales_id.eq.${ctx.employeeId},assigned_marketing_id.eq.${ctx.employeeId}`)}
 if(sp.get('status'))q=q.eq('status',sp.get('status')!); if(sp.get('department'))q=q.eq('assigned_department',sp.get('department')!); if(sp.get('assignedEmployeeId'))q=q.eq('assigned_employee_id',sp.get('assignedEmployeeId')!); if(sp.get('search')){const s=sp.get('search')!.replace(/[%_]/g,'');if(s)q=q.or(`name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%,phone.ilike.%${s}%`)}
 const {data,error}=await q; if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({data:data??[]});
}

export async function POST(request: Request) {
 const ctx=await getAuthContext(); if(!ctx.employeeId&&!ctx.isAdmin)return NextResponse.json({error:'Unauthorized'},{status:401}); const body=await request.json();
 const data=clean(body,canManage(ctx)); if(!data.name||!data.email)return NextResponse.json({error:'Name and email are required'},{status:400});
 if(data.status&&!statusValues.includes(String(data.status)))return NextResponse.json({error:'Invalid lead status'},{status:400});
 if(!canManage(ctx)){data.assigned_employee_id=ctx.employeeId;data.assigned_department=ctx.department;data.status='Assigned';}
 data.last_activity_at=new Date().toISOString();
 const {data:lead,error}=await supabase.from('leads').insert(data).select('*').single(); if(error)return NextResponse.json({error:error.message},{status:500});
 await supabase.from('lead_activities').insert({lead_id:lead.id,employee_id:ctx.employeeId,department:ctx.department,activity_type:'created',details:'Lead created'});
 return NextResponse.json({success:true,data:lead},{status:201});
}

export async function PATCH(request: Request) {
 const ctx=await getAuthContext(); if(!ctx.employeeId&&!ctx.isAdmin)return NextResponse.json({error:'Unauthorized'},{status:401}); const body=await request.json(); const leadId=String(body.leadId||''); if(!leadId)return NextResponse.json({error:'leadId is required'},{status:400});
 const {data:lead,error:findError}=await supabase.from('leads').select('*').eq('id',leadId).single(); if(findError||!lead)return NextResponse.json({error:'Lead not found'},{status:404});
 if(!visibleTo(ctx,lead))return NextResponse.json({error:'Forbidden'},{status:403});
 const allowAssignment=canManage(ctx); const data=clean(body,allowAssignment); delete data.leadId; data.last_activity_at=new Date().toISOString();
 if(data.status&&!statusValues.includes(String(data.status)))return NextResponse.json({error:'Invalid lead status'},{status:400});
 if(data.conversion_probability!==undefined)data.conversion_probability=Math.max(0,Math.min(100,Number(data.conversion_probability)||0));
 if(data.lead_score!==undefined)data.lead_score=Math.max(0,Math.min(100,Number(data.lead_score)||0));
 if(!allowAssignment){for(const key of assignmentFields)delete data[key];}
 if(data.status==='Contacted')data.last_contacted_at=new Date().toISOString(); if(data.status==='Qualified'&&!lead.qualified_at)data.qualified_at=new Date().toISOString(); if(data.status==='Converted')data.converted_at=new Date().toISOString();
 const {data:updated,error}=await supabase.from('leads').update(data).eq('id',leadId).select('*').single(); if(error)return NextResponse.json({error:error.message},{status:500});
 await supabase.from('lead_activities').insert({lead_id:leadId,employee_id:ctx.employeeId,department:ctx.department,activity_type:'updated',details:JSON.stringify(Object.keys(data))}); return NextResponse.json({success:true,data:updated});
}

export async function DELETE(request: Request) {
 const ctx=await getAuthContext(); if(!ctx.isAdmin&&!isDepartmentHead(ctx))return NextResponse.json({error:'Only administrators can delete leads'},{status:403}); const id=new URL(request.url).searchParams.get('id'); if(!id)return NextResponse.json({error:'id is required'},{status:400});
 const {error}=await supabase.from('leads').delete().eq('id',id); if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({success:true});
}
