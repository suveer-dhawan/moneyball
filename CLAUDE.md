# Moneyball

Mobile-first personal budgeting PWA. Used daily on iPhone home screens by
two independent users (separate accounts, no shared data).

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (must pass before considering work done)
- `npm run lint` — ESLint

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Supabase (Postgres + Auth), Row Level Security on all tables
- Recharts for charts, lucide-react for icons
- Deployed on Vercel

## Architecture
- Single-page client app; tab state switches between four screens
- Supabase tables: transactions, user_categories, budgets, income
  — all scoped by user_id, all protected by RLS (auth.uid() = user_id)

## Conventions
- TypeScript strict mode
- Keep the mobile-first, native-feel design language already in place
- Currency is AUD, displayed as $
- Do not introduce new dependencies without flagging it first

## Working agreement
- Explain proposed changes before large edits
- After changes, run `npm run build` to confirm nothing broke