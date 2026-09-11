export function configurationIssues(): string[] {
  const required = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'RATE_LIMIT_SECRET', 'APP_URL', 'TOYYIBPAY_SECRET_KEY', 'TOYYIBPAY_CATEGORY_CODE', 'CRON_SECRET', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_API_VERSION', 'WHATSAPP_TEMPLATE_MAP', 'WHATSAPP_APP_SECRET', 'WHATSAPP_WEBHOOK_VERIFY_TOKEN'];
  const issues = required.filter(key => !process.env[key]).map(key => `Missing ${key}`);
  for (const key of ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'APP_URL']) {
    try { if (new URL(process.env[key] || '').protocol !== 'https:') issues.push(`HTTPS required for ${key}`); } catch { issues.push(`Invalid ${key}`); }
  }
  if ((process.env.RATE_LIMIT_SECRET || '').length < 32) issues.push('RATE_LIMIT_SECRET must contain at least 32 characters');
  if (process.env.APP_URL !== process.env.NEXT_PUBLIC_SITE_URL) issues.push('APP_URL and NEXT_PUBLIC_SITE_URL must match');
  if ((process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') && ['fake','sandbox'].includes(process.env.PAYMENT_PROVIDER_MODE || 'live')) issues.push('Live payments required in production');
  if ((process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') && process.env.WHATSAPP_PROVIDER_MODE === 'fake') issues.push('Live notifications required in production');
  if ((process.env.CRON_SECRET || '').length < 32) issues.push('CRON_SECRET must contain at least 32 characters');
  if ((process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '').length < 32) issues.push('WhatsApp verification token must contain at least 32 characters');
  try {
    const templates = JSON.parse(process.env.WHATSAPP_TEMPLATE_MAP || '{}');
    for (const event of ['order_received','documents_required','payment_confirmed','submitted_for_production','plate_arrived','appointment_confirmed','appointment_changed','installation_completed']) {
      if (typeof templates?.[event] !== 'string' || !/^[a-z0-9_]+$/.test(templates[event])) issues.push(`Missing template for ${event}`);
    }
  } catch { issues.push('Invalid template mapping'); }
  return issues;
}
