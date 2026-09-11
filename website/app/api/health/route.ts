import { NextResponse } from 'next/server';
import { configurationIssues } from '@/lib/config';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    if (configurationIssues().length) throw new Error('configuration');
    const client = createSupabaseAdminClient();
    if (!client) throw new Error('configuration');
    const { error } = await client.from('notification_outbox').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ status: 'ready' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
