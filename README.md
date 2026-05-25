# BaiteConnect — Meru County Digital Public Participation Portal
## baiteconnect.meru.go.ke

### Quick Start
```bash
git clone https://github.com/merucounty/baiteconnect.git
cd baiteconnect
npm install
cp .env.example .env.local   # Fill in credentials
npx prisma db push
psql $DIRECT_URL -f prisma/migrations/001_add_postgis_ward_boundaries.sql
npm run db:seed
npx tsx scripts/seed-admin-users.ts
npm run dev
```

### Admin Login
Navigate to /admin/login → enter registered phone → receive SMS OTP → enter 6 digits → dashboard.

Roles: GOVERNOR_EXEC | COUNTY_ADMIN | MCA | CITIZEN

To seed admin accounts: `npx tsx scripts/seed-admin-users.ts`
To assign roles: /admin/users → ✏️ Role

### USSD: *384# on any network (no data needed)

### Tech: Next.js 14 · Neon PostgreSQL · PostGIS · Prisma · Africa's Talking · Tailwind CSS · PWA

### Legal: PFM Act 2012 · Constitution Art. 201 · County Governments Act 2012 · KDPA 2019
