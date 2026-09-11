import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { fingerprint, requireOrigin, siteOrigin, logEvent, boundedBody } from '@/lib/security';
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const text = new TextDecoder().decode(await boundedBody(request, 2048));
    if (text.length > 2048) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
    const data: unknown = JSON.parse(text);
    const email = data && typeof data === 'object' && 'email' in data && typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email.' }, { status: 400 });
    const admin = createSupabaseAdminClient();
    const client = await createSupabaseServerClient();
    if (!admin || !client) throw new Error('Unavailable');
    const { data: allowed, error } = await admin.rpc('eplate_rate_limit', { p_key: fingerprint(`email:${email}`), p_limit: 3, p_seconds: 900 });
    if (error) throw error;
    if (!allowed) return NextResponse.json({ error: 'Please wait before requesting another link.' }, { status: 429 });
    const { error: authError } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${siteOrigin()}/auth/callback/` } });
    if (authError) logEvent('auth.link', 'failed');
    return NextResponse.json({ message: 'Check your email for a sign-in link. If it does not arrive, try again later.' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    logEvent('auth.link', 'failed');
    return NextResponse.json({ error: 'Sign-in is unavailable. Please try again later.' }, { status: 503 });
  }
}
