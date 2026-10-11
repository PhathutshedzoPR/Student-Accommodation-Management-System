# Student Accommodation System

A full-stack residence management system with three role-based portals:

- **Resident** — apply for accommodation, track the application, see your room
  and balance, log complaints, invite visitors, read notifications.
- **Admin** — review and approve applications, manage buildings/rooms/beds,
  record charges and payments, run the complaints help desk, post
  announcements, and read the append-only audit log.
- **Security** — see today's expected visitors, check guests in/out against
  their verified ID, see who's currently inside, search visitor history, and
  file incident reports.

Built with **React 18 + TypeScript + Vite + Tailwind** on the frontend and
**Node.js + Express + TypeScript + Prisma + PostgreSQL** on the backend, per
the build guide this project was scaffolded from.

## Project layout

```
student-accommodation/
├── backend/     Express API, Prisma schema, seed script
└── frontend/    React app (Resident / Admin / Security portals)
```

## 1. Prerequisites

- Node.js 18+ and npm
- A PostgreSQL database (local, [Supabase](https://supabase.com), or
  [Railway](https://railway.app) all work)

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your Postgres connection string (and
change the JWT secrets / encryption key for anything beyond local dev).

```bash
# Generates the Prisma Client from prisma/schema.prisma — this step needs
# network access to download Prisma's engine binaries, so run it on your own
# machine/CI rather than inside a locked-down sandbox.
npx prisma generate

# Creates the database tables from the schema
npx prisma migrate dev --name init

# Loads demo data: an admin, a security officer, two residents (one with a
# room/charges/payments/complaints already set up), buildings/rooms/beds,
# a couple of visitors, and an announcement.
npm run seed

# Starts the API on http://localhost:3001
npm run dev
```

Demo logins (created by the seed script):

| Role     | Email                         | Password      |
|----------|--------------------------------|---------------|
| Admin    | admin@accommodation.test       | Admin123!     |
| Security | security@accommodation.test    | Security123!  |
| Resident | phathu@accommodation.test      | Resident123!  |
| Resident | thabo@accommodation.test       | Resident123!  |

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:3001/api
npm run dev
```

Open http://localhost:5173 — you'll land on the login page and be routed to
the right portal based on the account's role.

## How the system is organized

**Database schema** (`backend/prisma/schema.prisma`) — users (with a
`RESIDENT` / `ADMIN` / `SECURITY` role), residents, buildings → rooms → beds,
applications (+ uploaded documents), account charges & payments, complaints
(+ internal notes), visitors, incident reports, an append-only audit log,
announcements, and notifications.

**Auth & RBAC** — stateless JWT access tokens (15 min) carry the user's role;
a refresh token (7 days) renews them. `authenticate` middleware verifies the
token, `requireRole(...)` middleware enforces who can call each endpoint —
this is the real boundary between the three portals, not just hidden UI.

**Resident registration → application** — `/register` is a 4-step wizard
(account → student info → accommodation preference → documents). The account
is created after step 2, then the application + documents are submitted. The
resident then sees a live status tracker (Submitted → Documents verified →
Approved → Room assigned) on **My Application**.

**Visitors & the audit trail** — a resident invites a visitor in advance;
security verifies their ID in person and checks them in/out. Every invite,
check-in and check-out appends a row to the append-only `audit_logs` table
(nobody can delete from it), so there's a permanent record of who invited
whom, who let them in, and when they left. Incident reports are a separate
table so investigation notes never contaminate that trail.

**Money** — an admin posts charges (accommodation / electricity / laundry)
and records payments against a resident; the balance is always
`sum(charges) − sum(payments)`, computed on read so it's never out of sync.

**Sidebar layout** — every portal shares the same `Sidebar` component: nav
links at the top, and an identity strip fixed to the bottom (resident: name +
course + school; admin/security: email + role) so every page feels personal,
per the build guide's Phase 4.

## Notes on going to production

- File uploads currently land on local disk (`backend/uploads/`, served at
  `/uploads`). Swap `backend/src/utils/upload.ts` for an S3/Cloudinary multer
  storage adapter — nothing else needs to change.
- Visitor ID/passport numbers are encrypted at rest (AES-256,
  `backend/src/utils/crypto.ts`) using a key derived from `ENCRYPTION_KEY` —
  change that value in production and never commit the real one.
- `POST /api/payments/webhook` is a stub for a payment gateway (Peach
  Payments / PayFast are common choices for South Africa) — verify the
  gateway's signature before trusting the payload once you wire one up.
- Deploy targets from the original build guide: frontend → Vercel/Netlify,
  backend → Render/Railway, database → Supabase/Railway Postgres.
