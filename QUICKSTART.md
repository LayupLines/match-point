# Match Point - Quick Start Guide

## You're Almost Ready!

The Match Point application has been successfully built. Here's how to get it running:

## Current Project Location

The project is located at: `/Users/jeremyceille/Desktop/match-point/`

## Next Steps to Run the App

### Option 1: Use Prisma's Local Postgres (Simplest)

1. **Open Terminal and navigate to the project:**
   ```bash
   cd /Users/jeremyceille/Desktop/match-point
   ```

2. **Start Prisma's local PostgreSQL database:**
   ```bash
   npx prisma dev
   ```
   Keep this terminal window open - it will run the database.

3. **In a NEW terminal window, run the migrations:**
   ```bash
   cd /Users/jeremyceille/Desktop/match-point
   npx prisma migrate dev --name init
   ```

4. **Seed the database:**
   ```bash
   npx prisma db seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Go to http://localhost:3000

### Option 2: Use Your Own PostgreSQL Database

If you already have PostgreSQL installed:

1. **Create a database:**
   ```bash
   createdb matchpoint
   ```

2. **Update the `.env` file:**
   ```env
   DATABASE_URL="postgresql://your-username:your-password@localhost:5432/matchpoint?schema=public"
   ```

3. **Run migrations and seed:**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

## Test Accounts (After Seeding)

- **Admin**: admin@matchpoint.com / admin123
- **User 1**: user1@example.com / password123
- **User 2**: user2@example.com / password123

## What You Can Do

### As a Regular User:
1. Register or login
2. Browse public leagues
3. Create your own league
4. Join existing leagues
5. Submit picks for upcoming rounds
6. View standings

### As an Admin (admin@matchpoint.com):
1. Create tournaments (Men's/Women's Wimbledon)
2. Upload players via CSV
3. Enter match results
4. Trigger manual scoring
5. View all leagues and users

## Project Structure

```
/Users/jeremyceille/Desktop/match-point/
├── app/                 # Next.js pages and API routes
├── components/          # React components
├── lib/                 # Business logic and services
├── prisma/              # Database schema and migrations
├── types/               # TypeScript definitions
├── .env                 # Environment variables
├── README.md            # Full documentation
└── package.json         # Dependencies
```

## Common Commands

```bash
# Start development server
npm run dev

# Run Prisma Studio (visual database editor)
npx prisma studio

# Reset database (warning: deletes all data)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Database Connection Issues
- Make sure `npx prisma dev` is running in a separate terminal
- Check that the DATABASE_URL in `.env` is correct
- Try running `npx prisma generate` if you get client errors

### Module Not Found Errors
```bash
npm install
npx prisma generate
```

### Port Already in Use
```bash
# Kill the process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

## Need Help?

Check the full documentation in `README.md` for:
- Complete API documentation
- Game rules explanation
- Deployment instructions
- Admin operations guide
- CSV format specifications

## What's Next?

Once the app is running:

1. **Test the user flow**: Register → Create/Join League → Submit Picks
2. **Test admin functions**: Create tournament → Upload players → Enter results
3. **Check standings**: Verify scoring calculations work correctly
4. **Customize**: Modify colors, add features, adjust game rules

Enjoy your Wimbledon Survivor game!
