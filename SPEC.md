# Mobile Shop SaaS — Project Specification

## What We're Building

A multi-tenant SaaS platform for Pakistani mobile shops. A shop owner currently manages
sales, inventory, easy load, Easypaisa/JazzCash wallets, repair jobs, customer credit
(udhaar), and daily cash — all manually. This automates everything and can be sold to
other shops as a subscription product.

---

## Platforms

| Platform | Tech | URL |
|---|---|---|
| Web dashboard | Next.js 16 (App Router) | https://mobile-shop-saas-web.vercel.app |
| Android app | Expo (React Native) | — |
| Backend API | NestJS + Prisma | https://mobile-shop-saas.onrender.com/api/v1 |
| Database | Neon PostgreSQL | ep-tiny-wave-aphs40q9.c-7.us-east-1 |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | NestJS (REST + WebSockets via Socket.io) |
| Database | Neon PostgreSQL + Prisma ORM |
| Auth | JWT — email/password + Google OAuth + Phone OTP |
| File Storage | Cloudinary |
| Payments | Stripe (SaaS subscriptions) |
| Notifications | WhatsApp Business API (Meta Graph API v19) |
| Real-time | Socket.io — stock updates, repair status, cash register |
| Hosting | Vercel (web) + Render Docker (API) |
| CI/CD | GitHub Actions → lint + build gate → Render deploy hook |
| Monorepo | Turborepo + pnpm workspaces |

---

## Multi-Tenancy

- Every DB record has a `shopId` — no data crosses tenant boundaries
- Application-level isolation: `JwtAuthGuard` + `TenantMiddleware` on every request
- Subscription tiers enforced per shop:
  - **Free** — 1 user, basic POS
  - **Pro** — 3 users, all modules
  - **Business** — unlimited users, all modules + priority support

---

## Database Schema

| Table | Purpose |
|---|---|
| `shops` | Tenant root — name, city, enabled modules, subscription |
| `subscriptions` | Stripe sub ID, tier, status, trial end |
| `users` | Staff accounts — role: OWNER / CASHIER / TECHNICIAN |
| `products` | Inventory — category, buying/selling price, stock qty, IMEI flag |
| `imei_log` | Per-device IMEI tracking — status: IN_STOCK / SOLD |
| `sales` | Invoices — payment method, discount, credit flag |
| `sale_items` | Line items per sale — product, qty, unit price, IMEI |
| `purchases` | Stock-in events — supplier, total |
| `purchase_items` | Per-item stock additions |
| `customers` | Customer profiles — phone, balance owed (udhaar) |
| `ledger_entries` | Credit/payment history per customer |
| `easy_load_accounts` | SIM accounts per network (Jazz, Telenor, Zong, Ufone) |
| `easy_load_txns` | Load transactions — amount, customer phone, profit |
| `easypaisa_accounts` | Agent wallet accounts |
| `easypaisa_txns` | Send / receive / cash-in / cash-out / withdraw |
| `repair_jobs` | Job cards — device, fault, status, advance paid, quote |
| `repair_parts` | Parts used per job — deducted from inventory |
| `cash_register` | Daily sessions — opening/closing balance |
| `cash_expenses` | Manual expense entries per session |

---

## API Modules

| Module | Endpoints | Notes |
|---|---|---|
| Auth | register, login, google, otp/send, otp/verify, me | JWT + Google OAuth + Phone OTP |
| Shops | GET /, GET /stats, PATCH / | Per-shop settings and dashboard stats |
| Users | CRUD + invite + role update | Owner-only for mutations |
| Inventory | CRUD products, add stock, IMEI list, low-stock | IMEI tracking toggle per product |
| Sales | Create sale, list, daily summary | Validates stock + IMEI + ledger on credit |
| Purchases | List purchases | Stock additions via inventory addStock |
| Customers | CRUD, record payment, WhatsApp reminder | Udhaar ledger |
| Easy Load | Accounts CRUD, load, topup, daily summary | Per-network SIM balance tracking |
| Easypaisa | Accounts CRUD, transactions | Send/receive/cash-in/cash-out/withdraw |
| Repairs | Job cards, status updates, add parts | WhatsApp alert on READY status |
| Cash Register | Open day, add expense, close day, history | Daily cash session |
| Reports | Overview P&L, top products, receivables | Date range filters |
| Subscriptions | Checkout session, webhook, get subscription | Stripe billing |
| Gateway | Socket.io — shop:{shopId} rooms | Real-time events to dashboard |
| Notifications | WhatsApp Business API | Triggered by repairs + customers |

---

## Web Dashboard Pages

| Route | Status | Description |
|---|---|---|
| `/` | ✅ Done | Landing page |
| `/auth/login` | ✅ Done | Email + phone OTP + Google |
| `/auth/register` | ✅ Done | Shop registration + trial |
| `/auth/callback` | ✅ Done | Google OAuth token handler |
| `/dashboard` | ✅ Done | Stats cards + low stock + easy load summary |
| `/dashboard/inventory` | ⬜ Todo | Product list, add product, add stock, IMEI |
| `/dashboard/sales` | ⬜ Todo | POS cart, invoice, payment |
| `/dashboard/customers` | ⬜ Todo | Customer list, ledger, udhaar |
| `/dashboard/easy-load` | ⬜ Todo | SIM accounts, load transaction |
| `/dashboard/easypaisa` | ⬜ Todo | Wallet accounts, transactions |
| `/dashboard/repairs` | ⬜ Todo | Job cards, status flow |
| `/dashboard/cash-register` | ⬜ Todo | Daily session, expenses, close |
| `/dashboard/reports` | ⬜ Todo | P&L charts, top products |
| `/dashboard/settings` | ⬜ Todo | Shop profile, staff, subscription |

---

## Mobile App Screens

| Screen | Status | Description |
|---|---|---|
| Login | ✅ Done | Email + phone OTP |
| Dashboard | ✅ Done | Stats cards, pull-to-refresh |
| Inventory | ⬜ Todo | Product list + quick stock add |
| POS / Sale | ⬜ Todo | Cart, barcode scan, payment |
| Repairs | ⬜ Todo | Job list, status update |
| Easy Load | ⬜ Todo | Quick load transaction |
| Cash Register | ⬜ Todo | Open/close day |

---

## Build Phases

### Phase 1 — Foundation + CI/CD ✅ Complete
- Monorepo, NestJS API, Next.js web, Neon DB, GitHub Actions, Auth, multi-tenant middleware
- Both deployed: Render + Vercel

### Phase 2 — Core POS ⬜ Next
- Inventory page (product CRUD, add stock, IMEI management)
- Sales / POS page (cart, invoice, payment methods)
- Purchase history page
- Low stock alert UI

### Phase 3 — Financial Services
- Easy Load module UI
- Easypaisa / JazzCash module UI
- Customer ledger (Udhaar) UI
- Daily cash register UI

### Phase 4 — Repairs
- Job card creation and list
- Status tracking with timeline
- Parts deduction from inventory

### Phase 5 — Reports + SaaS Billing
- Analytics dashboard with charts (Recharts)
- Stripe upgrade flow in-app
- Tier enforcement + upgrade prompts
- Shop settings + staff management

### Phase 6 — Polish + Launch
- Thermal printer support (80mm receipt)
- Offline mode with sync queue (mobile)
- Onboarding tour
- Landing page for SaaS marketing

---

## Key Architectural Decisions

- **No Supabase** — pure NestJS + Prisma + Neon
- **IMEI + manual entry** — `imeiTracked` boolean per product; both flows coexist
- **OTP in-memory** — `Map<phone, {otp, expiresAt}>` with 10min TTL; replace with Redis for scale
- **WhatsApp via Meta Graph API** — not Twilio; fires on repair READY + udhaar reminders
- **Stripe via require()** — namespace type issue with nodenext moduleResolution; unsafe rules disabled for subscriptions.service.ts only
- **Docker runner uses fresh npm install** — avoids pnpm hoisting gaps where @nestjs/* live in root node_modules but runner only had apps/api/node_modules
