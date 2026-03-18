# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run lint      # ESLint check
npm start         # Start production server
```

No test suite is configured. There is a Prisma schema but migrations are not used — the database is managed directly via Supabase dashboard.

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase (PostgreSQL) + Tailwind CSS 4

**Layer structure:**
1. `src/app/` — Pages and API routes (App Router)
2. `src/lib/services/` — All business logic (15 service files)
3. `src/components/` — Reusable React components
4. `src/lib/` — Auth config, crypto utils, QR, Supabase client, validators

API routes delegate directly to services. Services use the Supabase JS client (`src/lib/supabase.ts`) for all DB operations. Prisma schema (`prisma/schema.prisma`) documents the data model but is not used at runtime.

## Key Domains

**Courses & Exams:** Products → Enrollments → Course modules/videos → Exam attempts → Certificates. Buyers register Students under their account; only Students take exams.

**E-commerce:** Wompi is the primary payment provider (Colombia). Stripe SDK is present. Order pricing supports tiered/bulk discounts. Discount codes with usage limits.

**Sanitation Plan AI:** `ai-plan.service.ts` uses Claude Sonnet 4.6 + Voyage AI embeddings (RAG) to generate custom food-safety sanitation plans. Plans are exported as PDFs with QR codes and optional professional signatures.

**Certificate Verification:** Certificates get a cryptographic hash + unique code + QR code. Public verification endpoint at `/verify/[code]`.

**User Roles:** `ADMIN`, `BUYER`, `STUDENT`, `PROFESSIONAL`. Role is stored in the NextAuth JWT session and checked in API routes.

## Auth

NextAuth.js with Credentials provider (email/password via Supabase) and Google OAuth. Config in `src/lib/auth/auth-options.ts`. Session includes `role`, `id`, and `supabaseAccessToken`. Use `getServerSession(authOptions)` in API routes and `useSession()` in components.

## Path Alias

`@/*` resolves to `src/*` (configured in `tsconfig.json`).

## Environment Variables

Required in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`
- `BREVO_API_KEY` (email), `ANTHROPIC_API_KEY`, `VOYAGE_API_KEY`

## Language

App content and UI text are in Spanish (Colombian market focus).
