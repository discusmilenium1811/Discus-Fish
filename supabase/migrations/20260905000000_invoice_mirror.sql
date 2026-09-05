-- ─────────────────────────────────────────────────────────────────────────────
-- Invoice mirror (2026-09-05)
--
-- Stripe remains the system of record for invoices, but the owner had no copy
-- outside the Stripe Dashboard: after a sale only the customer received the
-- invoice, which left nothing to file for tax. This table mirrors the handful of
-- fields an admin list needs, plus Stripe's own hosted/PDF URLs.
--
-- It deliberately does NOT reconstruct the document. `invoice_pdf_url` points at
-- the PDF Stripe generated, so the file the owner opens or receives by email is
-- byte-for-byte the one the customer got — which is the whole point.
--
-- This supersedes the invoices table dropped in 20260630000000: that one tried to
-- BE the invoice, this one only points at Stripe's.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  -- Stripe's id is the idempotency key: the webhook may see the same invoice on
  -- both checkout.session.completed and invoice.paid, and Stripe redelivers events.
  stripe_invoice_id text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  number text,
  status text,
  customer_name text,
  customer_email text,
  currency text not null default 'eur',
  -- Catalog prices include VAT, so subtotal_cents already contains vat_cents and
  -- total = subtotal (less any discount). The net figure for a VAT return is
  -- total_cents - vat_cents; it is derived rather than stored.
  subtotal_cents integer not null default 0,
  vat_cents integer not null default 0,
  total_cents integer not null default 0,
  hosted_invoice_url text,
  invoice_pdf_url text,
  issued_at timestamptz,
  -- Stamped BEFORE the owner copy is sent, so a redelivered event cannot send twice.
  owner_emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc);
create index if not exists invoices_order_idx on public.invoices (order_id);

alter table public.invoices enable row level security;

-- Admin-only reading. The stripe-webhook writes with the service role, which
-- bypasses RLS, so no insert/update policy is needed for anyone else.
-- is_admin() is wrapped in a select so the planner evaluates it once per query
-- rather than once per row (see 20260711000000_advisor_rls_initplan_and_fn_grants).
drop policy if exists invoices_admin_read on public.invoices;
create policy invoices_admin_read on public.invoices
  for select to authenticated using ((select public.is_admin()));

-- Supabase's default privileges hand `authenticated` every privilege on a new
-- public table. RLS already blocks writes (there is no insert/update/delete
-- policy), but the table grants should say the same thing — mirrors what
-- 20260629020000_harden_admin_access did for profiles.
revoke all on table public.invoices from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.invoices from authenticated;
grant select on table public.invoices to authenticated;
