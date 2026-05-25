#!/bin/bash
# scripts/setup.sh — BaiteConnect first-time setup
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          BaiteConnect — Meru County Setup Script         ║"
echo "║               baiteconnect.meru.go.ke                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check node
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Please install Node.js 18+ first."
  exit 1
fi
NODE_VER=$(node --version | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌  Node.js 18+ required. Found: $(node --version)"
  exit 1
fi
echo "✅  Node.js $(node --version)"

# Install dependencies
echo ""
echo "📦  Installing dependencies..."
npm install
echo "✅  Dependencies installed"

# Environment setup
if [ ! -f .env.local ]; then
  echo ""
  echo "📋  Creating .env.local from template..."
  cp .env.example .env.local
  echo "⚠️   Please edit .env.local and fill in:"
  echo "    - DATABASE_URL (Neon PostgreSQL)"
  echo "    - DIRECT_URL   (Neon direct connection)"
  echo "    - JWT_SECRET   (run: openssl rand -hex 32)"
  echo "    - AFRICAS_TALKING_API_KEY"
  echo ""
  echo "    Then re-run this script."
  exit 0
fi
echo "✅  .env.local exists"

# Check DATABASE_URL
if grep -q "replace_with" .env.local || grep -q "\[user\]" .env.local; then
  echo "⚠️   DATABASE_URL in .env.local appears unconfigured. Skipping DB setup."
  echo "    Edit .env.local with your Neon credentials, then run:"
  echo "    npm run db:push && npm run db:seed"
else
  echo ""
  echo "🗄️   Pushing Prisma schema to database..."
  npx prisma generate
  npx prisma db push
  echo "✅  Schema pushed"

  echo ""
  echo "🌱  Running PostGIS migration..."
  if command -v psql &> /dev/null; then
    DIRECT=$(grep "^DIRECT_URL" .env.local | cut -d'"' -f2)
    psql "$DIRECT" -f prisma/migrations/001_add_postgis_ward_boundaries.sql && echo "✅  PostGIS boundaries seeded" || echo "⚠️   PostGIS migration skipped (run manually)"
  else
    echo "⚠️   psql not found — run PostGIS migration manually:"
    echo "    psql \$DIRECT_URL -f prisma/migrations/001_add_postgis_ward_boundaries.sql"
  fi

  echo ""
  echo "🌱  Seeding database..."
  npm run db:seed
  echo "✅  Database seeded: 45 wards, 8 projects, sub-locations, MCA proposals"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅  Setup complete!                                      ║"
echo "║                                                          ║"
echo "║  Start development server:  npm run dev                  ║"
echo "║  Open browser:              http://localhost:3000         ║"
echo "║  Admin panel:               http://localhost:3000/admin   ║"
echo "║  DB studio:                 npm run db:studio             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
