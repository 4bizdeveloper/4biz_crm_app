import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { prisma } from '@/lib/prisma';
import { toApiLeadStatus } from '@/lib/lead-status';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rows = await prisma.leads.findMany({
      where: ctx.isAdmin ? {} : { assigned_department: ctx.department ?? undefined, ...(ctx.branch ? { branch: ctx.branch } : {}) },
      select: {
        id: true,
        status: true,
        value: true,
        estimated_budget: true,
        lead_score: true,
        conversion_probability: true,
        assigned_department: true,
        assigned_employee_id: true,
        assigned_marketing_id: true,
        assigned_sales_id: true,
        marketing_pipeline_stage: true,
        sales_pipeline_stage: true,
        source: true,
        created_at: true,
        updated_at: true,
        next_action_at: true,
        is_high_conversion_probable: true,
      },
    });

    const total = rows.length;
    const weightedPipeline = rows.reduce(
      (sum, row) => sum + Number(row.value || row.estimated_budget || 0) * (Number(row.conversion_probability || 0) / 100),
      0,
    );
    const openPipeline = rows
      .filter((row) => !['Converted', 'Disqualified'].includes(String(row.status)))
      .reduce((sum, row) => sum + Number(row.value || row.estimated_budget || 0), 0);
    const converted = rows.filter((row) => row.status === 'Converted').length;
    const overdue = rows.filter(
      (row) => row.next_action_at && row.next_action_at.getTime() < Date.now() && !['Converted', 'Disqualified'].includes(String(row.status)),
    ).length;

    const byStatus = Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
      const key = toApiLeadStatus(row.status || 'Unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([status, count]) => ({ status, count }));

    const bySource = Object.entries(rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.source || 'Unknown');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([source, count]) => ({ source, count }));

    return NextResponse.json({
      total,
      converted,
      conversionRate: total ? Number(((converted / total) * 100).toFixed(1)) : 0,
      openPipeline,
      weightedPipeline,
      overdue,
      highConversion: rows.filter((row) => row.is_high_conversion_probable).length,
      byStatus,
      bySource,
    });
  } catch (error) {
    console.error('Unable to load pipeline analytics:', error);
    return NextResponse.json({ error: 'Unable to load pipeline analytics.' }, { status: 500 });
  }
}
