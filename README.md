# 🎯 Moneyball

Moneyball is a premium, mobile-first personal finance and budgeting application designed for speed, clarity, and actionable insights. Built with a focus on frictionless data entry and dynamic visualization, it allows users to track expenses in under 3 seconds and monitor monthly budget caps in real-time.

## ✨ Features

- **Lightning-Fast Entry:** An oversized, mobile-optimized numpad designed for 1-handed, 3-second transaction logging.
- **Dynamic Insights Dashboard:** Visual monthly breakdowns utilizing interactive donut charts and smart category grouping.
- **Proactive Budgeting:** Set custom monthly limits per category. Progress bars dynamically update and warn users visually (Amber at 80%, Red at >100%) as they approach their caps.
- **Custom Category Engine:** Fully personalized transaction categories with smart drill-down capabilities (e.g., Grouping "Groceries - Coles" and "Groceries - Aldi" under a master "Groceries" view).
- **Enterprise-Grade Security:** Full user authentication and database protection via PostgreSQL Row Level Security (RLS).
- **Native iOS Feel:** Designed with Tailwind CSS to mimic native mobile applications, including frosted glass headers, hidden scrollbars, and fluid touch interactions.

## 🛠 Tech Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (App Router)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/) (Data Visualization)
- [Lucide React](https://lucide.dev/) (Iconography)

**Backend & Database:**
- [Supabase](https://supabase.com/) (PostgreSQL Database)
- Supabase Authentication
- Row Level Security (RLS) Policies

**Deployment:**
- [Vercel](https://vercel.com)

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+ 
- A free [Supabase](https://supabase.com/) account.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/moneyball.git](https://github.com/yourusername/moneyball.git)
   cd moneyball

2. **Install dependencies:**
    ```bash
    npm install

3. **Set up Environment Variables:**
Create a `.env.local` file in the root directory and add your Supabase project keys:

    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

4. **Database Setup:**
Run the following SQL queries in your Supabase SQL Editor to generate the necessary tables and security policies:

Note: Ensure Row Level Security (RLS) is enabled and policies are set to allow authenticated users to `INSERT`, `SELECT`, `UPDATE`, and `DELETE` their own rows (`auth.uid() = user_id`).

- transactions (id, created_at, amount, category, notes, date, user_id)
- user_categories (id, created_at, name, user_id)
- budgets (id, created_at, category, limit_amount, user_id)

5. **Run the development server:**
    ```bash
    npm run dev

## 📱 Progressive Web App (PWA) Usage
Moneyball is heavily optimized for mobile browsers. For the best experience on iOS:

1. Navigate to the deployed Vercel URL in Safari.
2. Tap the Share icon at the bottom of the screen.
3. Select Add to Home Screen.
4. Launch Moneyball directly from your home screen for a fullscreen, native app experience.
---
Designed and built for financial clarity.