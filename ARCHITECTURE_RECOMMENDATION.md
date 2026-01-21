# Fridge MVP - Architecture & Build Recommendation

Based on the review of the "Fridge MVP" documentation (Checklist, Cost Estimate, Slide Deck), here is the recommended robust and efficient build strategy.

## 1. Executive Summary
The project requires a **WhatsApp-first workflow** integrated with an **Operational Dashboard** and a **Field Runner App**.
While the initial documents mention Airtable/Sheets and n8n/Make, moving to a **Supabase + Next.js** stack is recommended for the following reasons:
*   **Cost Efficiency:** Eliminates per-seat pricing of Airtable/Make as you scale.
*   **Media Handling:** Supabase Storage is superior for handling photos from field runners/WhatsApp.
*   **Real-time:** Supabase Realtime is perfect for the "Ops Dashboard" to show incoming leads instantly.
*   **Unified Auth:** Manage access for Admins (Ops) and Runners in one system.

## 2. Recommended Stack

### A. Core Infrastructure: **Supabase**
*   **Database:** PostgreSQL (Relational data for Leads, Tickets, Runners, Villages).
*   **Auth:** Secure login for Ops Staff and Runners.
*   **Storage:** Buckets for storing photos upload via WhatsApp/Runner App.
*   **Edge Functions:** Serverless functions to handle **WhatsApp Webhooks** directly (replacing n8n for core logic) to ensure reliability and speed.

### B. Frontend / App: **Next.js (App Router)**
*   **Ops Dashboard:** Admin panel for managing tasks, viewing the Kanban board (Leads -> Quotes -> Jobs).
*   **Runner App:** A mobile-optimized web view (PWA) for runners to scan QR codes and verify payments.

### C. WhatsApp Provider: **Meta Cloud API (Official)** or **Twilio**
*   **Meta Cloud API:** Lowest direct cost. connect via Supabase Edge Functions.
*   **Twilio:** Easier wrapper, slightly higher cost, but excellent documentation.
*   *Recommendation: Start with Meta Cloud API for long-term cost savings if you are comfortable with slightly more setup, or Twilio for speed.*

## 3. Revised Implementation Roadmap

Instead of the "Spreadsheet + n8n" approach, here is the robust MVP build flows:

### Step 1: Data Modeling (Supabase)
Create schema for:
*   `leads` (linked to WhatsApp ID, Status)
*   `villages` (Location data)
*   `tickets` (Jobs, linked to photos)
*   `users` (Ops vs Runners)

### Step 2: WhatsApp Webhook Handler (Supabase Edge Function)
Write a TypeScript function to:
1.  Receive Webhook from Meta.
2.  Parse message (Text/Image/Location).
3.  Look up state in DB.
4.  Reply via API.
5.  Store media in Storage if present.

### Step 3: Ops Dashboard (Next.js)
*   **Kanban Board:** View incoming leads.
*   **Ticketing:** Assign leads to Runners.

### Step 4: Runner Flow (Next.js Mobile View)
*   Simple mobile web page.
*   Scanner capability (using html5-qrcode or similar).
*   Upload proof of work forms.

## 4. Why this is "Most Efficient"
1.  **Strict Typing:** using TypeScript across the DB (generated types) and Frontend prevents "fragile spreadsheet" bugs.
2.  **Scalability:** You can handle 10k+ leads without hitting "row limits" or "zap limits".
3.  **Extensibility:** Easier to add payments (Stripe/Paystack) or complex logic later than in a no-code tool.

## 5. Next Steps
If you approve this direction, I can:
1.  **Initialize** a new Next.js + Supabase project in this repo.
2.  **Define** the Database Schema (SQL).
3.  **Draft** the first Edge Function for the WhatsApp "Hello" flow.
