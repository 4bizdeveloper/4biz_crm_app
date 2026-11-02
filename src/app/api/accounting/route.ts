import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { canAccessDepartment, getAuthContext, isDepartmentHead } from '@/lib/department-auth';

export const dynamic = 'force-dynamic';
const db = supabaseAdmin;
const jsonError = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
async function authorize() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return { error: jsonError('Unauthorized', 401) } as const;
  // Super Admin is the global workspace administrator and must bypass all
  // department-level checks. Non-admins remain restricted to Finance heads.
  if (!ctx.isAdmin && (!canAccessDepartment(ctx, 'Finance') || !isDepartmentHead(ctx))) {
    return { error: jsonError('Forbidden: Finance department access required', 403) } as const;
  }
  return { ctx } as const;
}
const validAmount = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v > 0;
const validNonNegative = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const validDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

export async function GET() {
  const auth = await authorize(); if ('error' in auth) return auth.error;
  if (!db) return jsonError('Accounting server key is missing. Configure SUPABASE_SECRET_KEY in Vercel for Production, Preview and Development.', 503);
  const [invoices, expenses, payments, accounts, journals, vendors] = await Promise.all([
    db.from('invoices').select('*,lead:leads(id,name,company)').order('due_date', { ascending: true }),
    db.from('accounting_expenses').select('*,vendor:accounting_vendors(id,name),category:accounting_accounts(id,code,name)').order('expense_date', { ascending: false }).limit(500),
    db.from('accounting_payments').select('*,invoice:invoices(id,client_name,amount,tax_amount,status)').order('payment_date', { ascending: false }).limit(500),
    db.from('accounting_accounts').select('*').eq('is_active', true).order('code'),
    db.from('accounting_journal_entries').select('*,lines:accounting_journal_lines(*,account:accounting_accounts(code,name,account_type))').order('entry_date', { ascending: false }).limit(200),
    db.from('accounting_vendors').select('*').order('name'),
  ]);
  const failed = [invoices,expenses,payments,accounts,journals,vendors].find(x => x.error);
  if (failed?.error) return jsonError(failed.error.message, 500);
  const inv = invoices.data ?? [];
  const paidByInvoice = new Map<string, number>();
  for (const p of payments.data ?? []) paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + Number(p.amount));
  const normalizedInvoices = inv.map(i => ({ ...i, paid_amount: paidByInvoice.get(i.id) ?? (i.status === 'Paid' ? Number(i.amount) + Number(i.tax_amount) : 0) }));
  const totalInvoiced = normalizedInvoices.filter(i => i.status !== 'Cancelled').reduce((s,i) => s + Number(i.amount) + Number(i.tax_amount), 0);
  const totalCollected = normalizedInvoices.reduce((s,i) => s + Math.min(Number(i.paid_amount), Number(i.amount) + Number(i.tax_amount)), 0);
  const totalExpenses = (expenses.data ?? []).filter(e => e.status !== 'Rejected').reduce((s,e) => s + Number(e.amount) + Number(e.tax_amount), 0);
  return NextResponse.json({ invoices: normalizedInvoices, expenses: expenses.data ?? [], payments: payments.data ?? [], accounts: accounts.data ?? [], journals: journals.data ?? [], vendors: vendors.data ?? [], metrics: { totalInvoiced, totalCollected, receivables: Math.max(0,totalInvoiced-totalCollected), totalExpenses, netCash: totalCollected-totalExpenses } });
}

export async function POST(request: Request) {
  const auth = await authorize(); if ('error' in auth) return auth.error;
  if (!db) return jsonError('Accounting server key is missing. Configure SUPABASE_SECRET_KEY in Vercel for Production, Preview and Development.', 503);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return jsonError('Invalid JSON body'); }
  const action = body.action;
  if (action === 'expense') {
    if (typeof body.description !== 'string' || !body.description.trim() || !validAmount(body.amount) || !validDate(body.expenseDate) || (body.taxAmount !== undefined && !validNonNegative(body.taxAmount))) return jsonError('Description, positive amount, non-negative tax and valid expense date are required');
    const { data, error } = await db.from('accounting_expenses').insert({ expense_number: `EXP-${Date.now()}`, description: body.description.trim(), amount: body.amount, tax_amount: validNonNegative(body.taxAmount) ? body.taxAmount : 0, expense_date: body.expenseDate, due_date: validDate(body.dueDate) ? body.dueDate : null, vendor_id: body.vendorId || null, category_account_id: body.accountId || null, currency: typeof body.currency === 'string' ? body.currency : 'AED', status: 'Pending', notes: typeof body.notes === 'string' ? body.notes : null, created_by: auth.ctx.employeeId }).select('*').single();
    if (error) return jsonError(error.message, 500); return NextResponse.json({ data }, { status: 201 });
  }
  if (action === 'payment') {
    if (typeof body.invoiceId !== 'string' || !validAmount(body.amount) || !validDate(body.paymentDate)) return jsonError('Invoice, positive payment amount and valid payment date are required');
    const { data: invoice, error: invoiceError } = await db.from('invoices').select('id,amount,tax_amount,status').eq('id',body.invoiceId).single();
    if (invoiceError || !invoice) return jsonError('Invoice not found',404);
    if (invoice.status === 'Paid' || invoice.status === 'Cancelled') return jsonError('This invoice cannot accept additional payments');
    const { data: prior, error: priorError } = await db.from('accounting_payments').select('amount').eq('invoice_id',body.invoiceId);
    if (priorError) return jsonError(priorError.message,500);
    const paid = (prior ?? []).reduce((s,p)=>s+Number(p.amount),0);
    const total = Number(invoice.amount)+Number(invoice.tax_amount);
    if (Number(body.amount) > total-paid+0.005) return jsonError('Payment exceeds the outstanding invoice balance');
    const { data, error } = await db.from('accounting_payments').insert({ invoice_id: body.invoiceId, amount: body.amount, payment_date: body.paymentDate, method: typeof body.method === 'string' ? body.method : 'Bank Transfer', reference: typeof body.reference === 'string' ? body.reference : null, created_by: auth.ctx.employeeId }).select('*').single();
    if (error) return jsonError(error.message,500);
    const nextPaid = paid+Number(body.amount);
    await db.from('invoices').update({ status: nextPaid >= total ? 'Paid' : 'Sent' }).eq('id',body.invoiceId);
    return NextResponse.json({ data },{status:201});
  }
  if (action === 'invoice') {
    if (typeof body.clientName !== 'string' || !body.clientName.trim() || !validAmount(body.amount) || !validDate(body.dueDate) || (body.taxAmount !== undefined && !validNonNegative(body.taxAmount))) return jsonError('Client, positive amount, non-negative tax and due date are required');
    const { data, error } = await db.from('invoices').insert({ client_name: body.clientName.trim(), amount: body.amount, tax_amount: validAmount(body.taxAmount) ? body.taxAmount : 0, due_date: body.dueDate, status: 'Draft', lead_id: typeof body.leadId === 'string' ? body.leadId : null, created_by: auth.ctx.employeeId }).select('*').single();
    if (error) return jsonError(error.message,500); return NextResponse.json({ data },{status:201});
  }
  if (action === 'expense-status') {
    if (typeof body.id !== 'string' || !['Approved','Rejected','Paid'].includes(String(body.status))) return jsonError('Expense and valid status are required');
    const { data, error } = await db.from('accounting_expenses').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id',body.id).select('*').single();
    if (error) return jsonError(error.message,500); return NextResponse.json({ data });
  }
  if (action === 'journal') {
    if (typeof body.description !== 'string' || !body.description.trim() || !validDate(body.entryDate) || !Array.isArray(body.lines) || body.lines.length < 2) return jsonError('Description, date and at least two journal lines are required');
    const lines = body.lines as Array<{accountId?:string;debit?:number;credit?:number;description?:string}>;
    if (lines.some(l => typeof l.accountId !== 'string' || !Number.isFinite(l.debit) || !Number.isFinite(l.credit) || (Number(l.debit) < 0) || (Number(l.credit) < 0) || ((Number(l.debit) > 0) === (Number(l.credit) > 0)))) return jsonError('Each journal line must contain an account and either a positive debit or a positive credit');
    const debit = lines.reduce((s,l)=>s+Number(l.debit),0), credit = lines.reduce((s,l)=>s+Number(l.credit),0);
    if (debit <= 0 || Math.abs(debit-credit) > 0.005) return jsonError('Journal entry must balance: total debits must equal total credits');
    const { data: entry, error: entryError } = await db.from('accounting_journal_entries').insert({ entry_number:`JE-${Date.now()}`,entry_date:body.entryDate,description:body.description.trim(),reference:typeof body.reference==='string'?body.reference:null,currency:typeof body.currency==='string'?body.currency:'AED',created_by:auth.ctx.employeeId }).select('*').single();
    if (entryError || !entry) return jsonError(entryError?.message ?? 'Unable to create journal entry',500);
    const { error: linesError } = await db.from('accounting_journal_lines').insert(lines.map(l=>({journal_entry_id:entry.id,account_id:l.accountId,description:l.description ?? null,debit:Number(l.debit),credit:Number(l.credit)})));
    if (linesError) { await db.from('accounting_journal_entries').delete().eq('id',entry.id); return jsonError(linesError.message,500); }
    const { data: posted, error: postError } = await db.rpc('post_accounting_journal',{p_entry_id:entry.id});
    if (postError) { await db.from('accounting_journal_entries').delete().eq('id',entry.id); return jsonError(postError.message,400); }
    return NextResponse.json({ data: posted },{status:201});
  }
  return jsonError('Unknown accounting action');
}

export async function PATCH(request: Request) {
  const auth = await authorize(); if ('error' in auth) return auth.error;
  if (!db) return jsonError('Accounting server key is missing. Configure SUPABASE_SECRET_KEY in Vercel for Production, Preview and Development.', 503);
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return jsonError('Invalid JSON body'); }
  if (typeof body.invoiceId !== 'string' || !['Draft','Sent','Overdue','Cancelled'].includes(String(body.status))) return jsonError('Invoice and supported status are required');
  const { data, error } = await db.from('invoices').update({ status: body.status }).eq('id',body.invoiceId).select('*').single();
  if (error) return jsonError(error.message,500); return NextResponse.json({ data });
}
