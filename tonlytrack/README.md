# 🚛 TonlyTrack — Fleet Maintenance Management System

A professional maintenance tracking platform for Tonly Trucks.

## Features
- ✅ Role-based auth (Technician / Supervisor / Senior Supervisor)
- 🚛 Truck fleet management with status tracking
- 📋 Maintenance tasks: daily, weekly, monthly, quarterly, yearly
- ⚠️ Fault reporting system with severity levels
- 👥 Team overview with performance stats
- 📊 Reports & analytics dashboard
- 🔴 Live updates via Supabase Realtime

---

## Quick Setup (5 minutes)

### 1. Create a Supabase project
1. Go to https://supabase.com and create a free account
2. Create a new project (remember your database password)
3. Wait for it to initialize (~2 min)

### 2. Run the database schema
1. In your Supabase project, go to **SQL Editor**
2. Paste the contents of `supabase_schema.sql`
3. Click **Run**

### 3. Configure environment variables
1. Copy `.env.example` → `.env.local`
2. In Supabase: go to **Settings → API**
3. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Install & run
```bash
npm install
npm run dev
```
App runs at: http://localhost:3000

### 5. Deploy (optional, free)
```bash
# Deploy to Vercel
npx vercel --prod
# Add env vars in Vercel dashboard
```

---

## Usage

1. **Register** as Senior Supervisor first
2. Go to **Trucks** → Add your fleet
3. Go to **Tasks** → Create maintenance schedules
4. Share app URL with team to register as Technicians
5. Technicians log in and complete their assigned tasks
6. You see real-time updates in the Dashboard

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Hosting**: Vercel (recommended, free tier)
