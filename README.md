# Fridge Workflow MVP

This project is built with **Next.js 14** (App Router) and **Supabase**.

## Structure

*   **/web**: The Full-stack Application
    *   `/app/ops`: Operations Dashboard (Admin)
    *   `/app/runner`: Field Runner App (Mobile PWA)
    *   `/app/api`: Backend Routes
*   **/supabase**: Database & Edge Functions
    *   `/migrations`: SQL Schemas
    *   `/functions`: WhatsApp Webhook Handler

## Getting Started

### 1. Prerequisites
*   Node.js 18+
*   Supabase CLI (`brew install supabase/tap/supabase`)

### 2. Setup Env
Copy the example env file in `web/`:
```bash
cp web/.env.local.example web/.env.local
```
Fill in your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase Project Settings.

### 3. Run Locally

```bash
cd web
npm install
npm run dev
```

Visit:
*   **Ops Dashboard:** http://localhost:3000/ops
*   **Runner App:** http://localhost:3000/runner

### 4. Deploying WhatsApp Function
To connect to Meta, you must deploy the edge function:

```bash
npx supabase login
npx supabase link --project-ref <your-project-id>
npx supabase functions deploy whatsapp --no-verify-jwt
```

Use the resulting URL as your **Callback URL** in the Meta Developer Dashboard.
