# Moneyball

A mobile-first budgeting app for logging spending quickly, installed to the
iPhone home screen as a PWA. Each account is private; there is no shared data.

## What it does

- **Entry** - a number pad for logging an expense, with up to four pinned
  categories, an optional note, and a date up to 60 days back. Tap a recent
  entry to edit it.
- **Income** - log paychecks and other income, backdated up to 60 days.
- **Insights** - per-month spending and savings, a cumulative pace chart,
  spending by category against budget limits (amber from 80%, red over 100%),
  and a six-month income vs spending trend.
- **Settings** - theme (Auto, Light, Dark, Warm), pinned categories,
  categories and monthly budget limits.

Categories named `Group - Item` (e.g. `Groceries - Aldi`) are grouped under
`Groceries` in Insights. A budget on the group applies to the whole group;
otherwise the group's limit is the sum of its items' budgets.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase
(Postgres + Auth), Recharts, lucide-react. Deployed on Vercel.

## Local development

Requires Node.js 20+ and a Supabase project.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Create the tables below in Supabase, enable Row Level Security on each, and
   add policies allowing `SELECT`, `INSERT`, `UPDATE` and `DELETE` where
   `auth.uid() = user_id`.

4. Start the dev server:

   ```bash
   npm run dev
   ```

Run `npm run build` and `npm run lint` before shipping changes.

## Database

Every table also has `id`, `created_at` and `user_id`.

| Table             | Columns                      | Notes                          |
| ----------------- | ---------------------------- | ------------------------------ |
| `transactions`    | `amount`, `category`, `notes`, `date` |                       |
| `income`          | `amount`, `source`, `date`   |                                |
| `user_categories` | `name`                       | unique on `(user_id, name)`    |
| `budgets`         | `category`, `limit_amount`   | unique on `(user_id, category)`|

New accounts are seeded with a default category list on first load.

## Installing on iPhone

Open the deployed URL in Safari, tap Share, then **Add to Home Screen**.
