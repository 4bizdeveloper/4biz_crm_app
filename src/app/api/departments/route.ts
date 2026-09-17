import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/department-auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx.employeeId && !ctx.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('departments')
    .select('id,code,name,description,is_active,department_modules(id,module_key,module_name,description,is_enabled)')
    .eq('is_active', true)
    .order('name');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
