#!/bin/bash

echo "🌱 Seeding production database..."
echo ""

# Get the production DATABASE_URL from Vercel
echo "Step 1: Getting production database URL from Vercel..."
vercel env pull .env.production.local

if [ -f .env.production.local ]; then
    echo "✓ Got production environment variables"

    echo ""
    echo "Step 2: Running database migrations..."
    DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2- | tr -d '"') npx prisma migrate deploy

    echo ""
    echo "Step 3: Seeding database with test data..."
    DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2- | tr -d '"') npx tsx prisma/seed.ts

    echo ""
    echo "✅ Database seeded successfully!"
    echo ""
    echo "Test accounts created:"
    echo "  Admin: admin@matchpoint.com / admin123"
    echo "  User 1: user1@example.com / password123"
    echo "  User 2: user2@example.com / password123"
    echo ""
    echo "You can now login at your Vercel URL!"
else
    echo "❌ Error: Could not get Vercel environment variables"
    echo ""
    echo "Please run these commands manually:"
    echo "  1. vercel link"
    echo "  2. vercel env pull .env.production.local"
    echo "  3. Then run this script again"
fi
