# 5-Day Go-Live Plan (Flower Site)

## Current baseline (completed)
- Backend build passes (`flower-backend npm run build`).
- Frontend build passes (`flower-frontend npm run build`).
- Profile page now includes:
  - Password change
  - Delivery address management
  - Saved card section (masked storage)
- Generic payment session flow is in place (provider-agnostic session endpoint).

## Day 1 - Freeze scope + critical stability
- Freeze feature scope (only launch blockers allowed).
- Run full smoke test paths:
  - Register/login/logout/refresh
  - Cart add/remove
  - Checkout create order
  - Payment session create
  - Admin order status update
- Validate environment variables for production and staging.
- Confirm CORS and API URL mapping (`NEXT_PUBLIC_API_URL`, backend CORS origin).
- Create launch branch and tag baseline.

Exit criteria:
- No red compile/runtime blocker.
- Core user journey smoke tests pass.

## Day 2 - Data + payment readiness
- Finalize payment provider selection and credentials.
- If provider != PAYTR, wire provider adapter in backend payment service.
- Verify callback/webhook validation and idempotency.
- Database migration dry-run on staging.
- Prepare seed data for products/categories/banners.

Exit criteria:
- Payment sandbox flow end-to-end passes.
- DB migration and rollback procedure documented.

## Day 3 - Security + observability
- Enforce production security config:
  - Strong JWT and cookie secrets
  - HTTPS-only deployment
  - CSRF policy decision
- Add/verify monitoring:
  - API logs
  - Frontend runtime errors
  - Basic uptime checks
- Rate-limit and brute-force checks in staging.
- Backup policy for PostgreSQL and Redis verified.

Exit criteria:
- Security checklist signed off.
- Alerting/monitoring is visible and tested.

## Day 4 - Staging dress rehearsal
- Deploy backend and frontend to staging with production-like env.
- Full UAT pass with checklist and bug triage.
- Performance sanity checks:
  - Home, products, checkout, profile load times
- Fix only P0/P1 issues.

Exit criteria:
- UAT approved.
- No open P0/P1 bugs.

## Day 5 - Production launch
- Production deployment window and rollback owner assigned.
- Deploy backend first, then frontend.
- Run post-deploy smoke tests on production.
- Announce launch and monitor first 2-4 hours.

Exit criteria:
- All production smoke tests green.
- No active critical incident in monitoring.

## Launch command checklist
- Backend
  - `npm ci`
  - `npm run prisma:generate`
  - `npm run prisma:deploy`
  - `npm run build`
  - `npm run start:prod`
- Frontend
  - `npm ci`
  - `npm run build`
  - `npm run start`

## Rollback checklist
- Keep previous backend image/version ready.
- Keep previous frontend deployment ready.
- DB migrations must have rollback plan before apply.
- Trigger rollback if payment, auth, or checkout P0 issue occurs.
