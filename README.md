# MyFollowUp — Sistem Pengurusan Follow-Up Pelanggan

Dashboard CRM untuk track subscription & follow-up pelanggan (Gemini Pro, ChatGPT Go, SuperGrok, dll).

## Architecture (Supabase + GitHub Pages)

- **Frontend**: React + Vite (static, di-host kat GitHub Pages — FREE)
- **Database**: Supabase (Postgres, free tier — data shared & permanent)
- **No backend server** — frontend bercakap terus dengan Supabase (PostgREST)

## Setup (3 langkah)

### 1. Supabase (database)

1. Register kat [supabase.com](https://supabase.com) (free).
2. Create **New Project** — beri nama `myfollowup`.
3. Buka **SQL Editor** → **New query**:
   - Paste & run `supabase/migration.sql` (buat tables + RLS)
   - Paste & run `supabase/seed.sql` (optional — 60 sample customers)
4. Pergi ke **Project Settings → API** — copy:
   - **Project URL** (e.g. `https://xxxx.supabase.co`)
   - **anon public key** (e.g. `eyJhbGci...`)

### 2. GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Project URL kau |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

### 3. Enable GitHub Pages

Repo → **Settings → Pages**:
- **Source**: `GitHub Actions`
- Push ke `main` → workflow auto-build & deploy.
- URL kau: `https://<username>.github.io/myfollowup/`

## Local Dev

```bash
cd client
cp .env.example .env.local   # isi VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

## Security Note

RLS dibuka untuk `anon` read+write (private single-user CRM). Jangan share URL awam. Untuk harden, tukar policies dari `to anon` ke `to authenticated` + guna Supabase Auth.
