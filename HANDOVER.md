# Discusfood — operations & handover

Everything you need to run, change and deploy this site. Written for whoever
maintains it, not just for the first launch.

- **Live site:** https://discusmileniumcy.com (canonical, no `www`; `www` 301s to it)
- **Repository:** `discusmilenium1811/Discus-Fish`, branch `main`
- **Hosting:** Netlify — account `Athinakonakai`
- **Backend:** Supabase project `vumjslsogdnexehutibj`
- **Payments:** Stripe (owner's account)
- **Domain / DNS:** Cloudflare

---

## 1. Architecture in one minute

It is a **static front end plus Supabase**. There is no application server.

```
Browser ──> Netlify (static files from dist/)
   │
   ├──> Supabase REST + Realtime      (products, orders, admin panel — guarded by RLS)
   ├──> Supabase Edge Function checkout ──> Stripe Checkout ──> customer pays
   └──< Stripe webhook ──> Supabase Edge Function stripe-webhook ──> writes the order
```

The customer never touches a server of ours during payment: the `checkout` function
creates a Stripe Checkout session and the browser is redirected to Stripe's own page.
Stripe then calls `stripe-webhook`, which is what actually records the order and
decrements stock. **If webhooks stop working, payments still succeed but orders stop
appearing** — that is the first thing to check if the shop looks broken.

> ⚠️ The `server/` folder is a **legacy Express API that is not deployed and not used**.
> The front end never calls it. It is kept for reference only. Never point a Stripe
> webhook at it — orders would silently vanish.

---

## 2. Where each setting lives

| Setting | Where it lives | Notes |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | **`netlify.toml`**, `[build.environment]` | ⚠️ Not in the Netlify UI. Values set in the dashboard with these names are **overridden** by this file. Edit the file. |
| `NODE_VERSION` | `netlify.toml` | Pinned to 22. Vite 8 / TS 6 need ≥ 20.19. |
| `CLIENT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **Supabase Edge Function secrets** | `npx supabase secrets list --project-ref vumjslsogdnexehutibj` |
| Site URL / redirect URLs for auth emails | Supabase Dashboard → Authentication → URL Configuration | |
| Google sign-in | Google Cloud Console → OAuth 2.0 Client | Authorised origins + redirect URIs must include the live domain. |
| Shipping zones, methods, weight tiers | **Database**, editable in the admin panel | No code change needed to alter shipping prices. |
| Prices, stock, products, coupons | Database / admin panel | |
| VAT rate (19%) | **Hardcoded** — `src/lib/pricing.ts` and `supabase/functions/checkout/index.ts` | Prices include VAT; this only affects the reported tax figure. |
| Packaging tare (250 g) | **Duplicated** — `src/lib/shipping.ts` and `supabase/functions/checkout/index.ts` | Must be changed in both or the charged shipping stops matching the cart. |
| Legal page text + company details | `src/i18n/legal.ts` (`COMPANY` at the top) | Three languages in one file. |

Your local `.env` holds only the two public Supabase values, the same ones in
`netlify.toml`. It is git-ignored, so keep it — it is what lets you run `npm run dev`
at home. There are no secrets in it.

---

## 3. Deploying

### Front end
`git push` to `main`. Netlify builds and publishes automatically. **Never deploy by
hand or by dragging `dist/` into Netlify** — that detaches the site from the repo.

### Edge functions
Not deployed by git. After changing anything under `supabase/functions/`:

```bash
npx supabase functions deploy checkout       --project-ref vumjslsogdnexehutibj --no-verify-jwt
npx supabase functions deploy stripe-webhook --project-ref vumjslsogdnexehutibj --no-verify-jwt
npx supabase functions deploy verify-business --project-ref vumjslsogdnexehutibj --no-verify-jwt
```

`--no-verify-jwt` is required: these endpoints are called by guests and by Stripe,
which do not carry a Supabase JWT. Authorisation is done inside each function.

### Database
Migrations live in `supabase/migrations/`. Check first, then apply:

```bash
npx supabase migration list --linked   # local vs remote
npx supabase db push --linked          # apply what is missing
```

### Secrets

```bash
npx supabase secrets set CLIENT_URL=https://discusmileniumcy.com --project-ref vumjslsogdnexehutibj
```

Changing a secret takes effect on the next cold start of the function. Redeploy the
function to be certain it picked it up.

---

## 4. Admin access

There is exactly one admin: `discusmilenium@outlook.com`.

Admin rights come from **`profiles.role = 'admin'`** — nothing else. `ADMIN_EMAILS` in
`server/.env` belongs to the unused Express server and grants nothing.

Row-level security blocks a user from promoting themselves, so a new admin must be
made from the Supabase SQL editor:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'someone@example.com');
```

Password rules (`src/auth/passwordPolicy.ts`): personal accounts 8 characters plus a
leaked-password check; business and admin accounts 12 characters plus mandatory TOTP
two-factor. If someone is locked out of 2FA, remove their MFA factor from the Supabase
dashboard under Authentication → Users.

---

## 5. Routine checks

| Symptom | Look here first |
|---|---|
| Payment succeeds but no order appears | Stripe → Developers → Webhooks → the live endpoint. Any response that is not `200` shows the reason. |
| Customer lands on the wrong site after paying | `CLIENT_URL` secret, and the fallback in `supabase/functions/checkout/index.ts`. |
| Google login or password reset goes to the wrong domain | Supabase → Authentication → URL Configuration, and the Google OAuth client. |
| Shipping price at checkout ≠ price on the site | The 250 g tare constant is out of sync between `src/lib/shipping.ts` and the checkout function. |
| Site builds locally but fails on Netlify | Node version. `netlify.toml` pins 22. |
| Images missing | They are served from the Supabase `product-images` bucket by absolute URL. Check the bucket is still public. |

Run `npx supabase` advisors or the dashboard's Advisors tab occasionally. Four
`SECURITY DEFINER` warnings for `is_admin`, `business_prices`,
`admin_list_business_accounts` and `admin_set_business_status` are **expected and
intentional** — those functions check permissions internally. Leaked-password
protection is a Supabase Pro feature and is off on the Free plan; a client-side
check in `src/auth/pwnedCheck.ts` covers it partially.

---

## 6. Things a future maintainer should know

- **`public/_headers` ships a Content-Security-Policy in report-only mode.** Once the
  live site has been browsed with the console open and no CSP reports appear, rename
  the header to `Content-Security-Policy` to enforce it.
- **No cookie banner, deliberately.** The site uses no analytics and no third-party
  tracking; only strictly necessary browser storage, which needs no consent. Adding
  Google Analytics or a Meta pixel would change that and require a consent banner.
- **Coupons create a one-off Stripe coupon object per discounted order.** Harmless,
  but the Stripe dashboard accumulates them.
- **Backups:** the Supabase Free plan keeps limited backups. With real orders coming
  in, the Pro plan ($25/month) adds daily backups, point-in-time recovery and
  leaked-password protection.
- **Bundle size warning on build is pre-existing** and not a fault.
