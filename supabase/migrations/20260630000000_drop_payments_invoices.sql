-- The admin "Order Payments" and "Invoices" sections were removed: all invoice
-- and payment records of record now live in Stripe, so mirroring them into the
-- local database is no longer needed. Drop the now-orphaned tables (CASCADE also
-- removes their indexes and any inbound foreign-key constraints). Idempotent so
-- it is safe to (re)apply against any environment.
drop table if exists public.invoices cascade;
drop table if exists public.payments cascade;
