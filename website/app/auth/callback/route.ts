import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { siteOrigin } from '@/lib/security';
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');
  const client = await createSupabaseServerClient();
  if (code && code.length < 4096 && client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/order/', siteOrigin()));
  }
  return NextResponse.redirect(new URL('/order/?auth_error=expired', siteOrigin()));
}
