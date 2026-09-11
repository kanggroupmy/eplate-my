# Legacy order service

This directory is preserved for migration and auditing. `website/` replaces its product workflows; never deploy its mock-payment, phone-OTP or password-based staff APIs as the canonical application. The normal deploy command refuses deployment. No remote Worker has been disabled by this repository change.

The original D1 schema is available in `migrations/0001_initial.sql`. Before importing, export the actual D1 schema/data and R2 objects and reconcile them against this baseline. Do not assume a checked-in migration proves the live schema matches.

Map customers by verified identity to Supabase Auth profiles; phone numbers alone do not establish email ownership. Map staff to named Supabase Auth identities and roles; do not migrate passwords, sessions or OTPs. Preserve order/invoice/provider references in an import mapping. Reconcile payments against ToyyibPay before marking any paid record confirmed; mock or unsigned legacy rows are not proof of payment. Map files by order/owner and verified object hashes into private buckets. Preserve audit history and notification references without replaying old notifications. Map installation dates and evidence to appointments and proofs only after reconciliation.

Take and restore-test backups, freeze legacy writes, import and reconcile counts/references/object hashes, validate customer/admin/installer access, then explicitly disable the remote Worker and switch approved DNS/provider callback routes. No remote deletion or import is performed by the code publication step.
