// ABOUTME: Database seed script that populates test data including admin and user accounts, Wimbledon 2026 tournaments, and sample leagues.
// Run with `npx prisma db seed` to set up a local development environment.
import 'dotenv/config'
import { PrismaClient, Gender, Role, TournamentLevel, TournamentStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { hashPassword } from '../lib/password'
import { ROUND_PRESETS } from '../lib/constants'

// Handle both Prisma dev and production database URLs
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined')
}

// Check if it's a Prisma dev URL (has api_key parameter)
const isPrismaDevUrl = databaseUrl.includes('api_key=')

let connectionString: string

if (isPrismaDevUrl) {
  // Decode Prisma dev URL for local development
  const match = databaseUrl.match(/api_key=([^&]+)/)
  if (!match) {
    throw new Error('Invalid Prisma dev DATABASE_URL format')
  }

  const apiKeyData = JSON.parse(Buffer.from(match[1], 'base64').toString())
  connectionString = apiKeyData.databaseUrl
} else {
  // Standard PostgreSQL URL (production)
  connectionString = databaseUrl
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const SAMPLE_PLAYERS_MEN = [
  { name: 'Novak Djokovic', seed: 1, country: 'SRB' },
  { name: 'Carlos Alcaraz', seed: 2, country: 'ESP' },
  { name: 'Jannik Sinner', seed: 3, country: 'ITA' },
  { name: 'Daniil Medvedev', seed: 4, country: 'RUS' },
  { name: 'Alexander Zverev', seed: 5, country: 'GER' },
  { name: 'Andrey Rublev', seed: 6, country: 'RUS' },
  { name: 'Stefanos Tsitsipas', seed: 7, country: 'GRE' },
  { name: 'Casper Ruud', seed: 8, country: 'NOR' },
  { name: 'Taylor Fritz', seed: 9, country: 'USA' },
  { name: 'Grigor Dimitrov', seed: 10, country: 'BUL' },
  // Add more unseeded players to reach 128
  ...Array.from({ length: 118 }, (_, i) => ({
    name: `Player ${i + 11}`,
    seed: i < 22 ? i + 11 : undefined,
    country: 'XXX'
  }))
]

const SAMPLE_PLAYERS_WOMEN = [
  { name: 'Iga Swiatek', seed: 1, country: 'POL' },
  { name: 'Aryna Sabalenka', seed: 2, country: 'BLR' },
  { name: 'Coco Gauff', seed: 3, country: 'USA' },
  { name: 'Elena Rybakina', seed: 4, country: 'KAZ' },
  { name: 'Jessica Pegula', seed: 5, country: 'USA' },
  { name: 'Ons Jabeur', seed: 6, country: 'TUN' },
  { name: 'Qinwen Zheng', seed: 7, country: 'CHN' },
  { name: 'Maria Sakkari', seed: 8, country: 'GRE' },
  { name: 'Barbora Krejcikova', seed: 9, country: 'CZE' },
  { name: 'Daria Kasatkina', seed: 10, country: 'RUS' },
  // Add more unseeded players to reach 128
  ...Array.from({ length: 118 }, (_, i) => ({
    name: `Player ${i + 11}`,
    seed: i < 22 ? i + 11 : undefined,
    country: 'XXX'
  }))
]

async function main() {
  console.log('Starting seed...')

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@matchpoint.com' },
    update: {},
    create: {
      email: 'admin@matchpoint.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN
    }
  })
  console.log('Created admin user:', admin.email)

  // Create test users
  const testPassword = await hashPassword('password123')
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      password: testPassword,
      name: 'Test User 1',
      role: Role.USER
    }
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      password: testPassword,
      name: 'Test User 2',
      role: Role.USER
    }
  })
  console.log('Created test users')

  // Create Men's Wimbledon 2026
  const mensTournament = await prisma.tournament.upsert({
    where: { year_gender_level: { year: 2026, gender: Gender.MEN, level: TournamentLevel.GRAND_SLAM } },
    update: {},
    create: {
      name: "Wimbledon Men's Singles 2026",
      year: 2026,
      gender: Gender.MEN,
      level: TournamentLevel.GRAND_SLAM,
      status: TournamentStatus.UPCOMING
    }
  })
  console.log('Created Men\'s tournament:', mensTournament.name)

  // Create Women's Wimbledon 2026
  const womensTournament = await prisma.tournament.upsert({
    where: { year_gender_level: { year: 2026, gender: Gender.WOMEN, level: TournamentLevel.GRAND_SLAM } },
    update: {},
    create: {
      name: "Wimbledon Women's Singles 2026",
      year: 2026,
      gender: Gender.WOMEN,
      level: TournamentLevel.GRAND_SLAM,
      status: TournamentStatus.UPCOMING
    }
  })
  console.log('Created Women\'s tournament:', womensTournament.name)

  // Create rounds for both tournaments
  const baseDate = new Date(2026, 5, 29) // June 29, 2026

  for (const tournament of [mensTournament, womensTournament]) {
    const roundConfigs = ROUND_PRESETS[tournament.level]
    for (const config of roundConfigs) {
      const lockTime = new Date(baseDate)
      lockTime.setDate(lockTime.getDate() + (config.roundNumber - 1) * 2)

      await prisma.round.upsert({
        where: {
          tournamentId_roundNumber: {
            tournamentId: tournament.id,
            roundNumber: config.roundNumber
          }
        },
        update: {},
        create: {
          tournamentId: tournament.id,
          roundNumber: config.roundNumber,
          name: config.name,
          requiredPicks: config.requiredPicks,
          lockTime
        }
      })
    }
    console.log(`Created ${roundConfigs.length} rounds for ${tournament.name}`)
  }

  // Add players
  for (const playerData of SAMPLE_PLAYERS_MEN) {
    await prisma.player.upsert({
      where: {
        tournamentId_name: {
          tournamentId: mensTournament.id,
          name: playerData.name
        }
      },
      update: {},
      create: {
        ...playerData,
        tournamentId: mensTournament.id
      }
    })
  }
  console.log('Added 128 men\'s players')

  for (const playerData of SAMPLE_PLAYERS_WOMEN) {
    await prisma.player.upsert({
      where: {
        tournamentId_name: {
          tournamentId: womensTournament.id,
          name: playerData.name
        }
      },
      update: {},
      create: {
        ...playerData,
        tournamentId: womensTournament.id
      }
    })
  }
  console.log('Added 128 women\'s players')

  // Create sample leagues
  const mensLeague = await prisma.league.create({
    data: {
      name: "The Championship League",
      description: "Join the best players competing for Wimbledon glory",
      tournamentId: mensTournament.id,
      creatorId: user1.id
    }
  })

  const womensLeague = await prisma.league.create({
    data: {
      name: "Ladies Championship League",
      description: "Follow the excitement of women's Wimbledon",
      tournamentId: womensTournament.id,
      creatorId: user2.id
    }
  })

  // Join users to leagues
  await prisma.leagueMembership.create({
    data: { userId: user1.id, leagueId: mensLeague.id }
  })
  await prisma.standings.create({
    data: { userId: user1.id, leagueId: mensLeague.id }
  })

  await prisma.leagueMembership.create({
    data: { userId: user2.id, leagueId: womensLeague.id }
  })
  await prisma.standings.create({
    data: { userId: user2.id, leagueId: womensLeague.id }
  })

  console.log('Created sample leagues')
  console.log('\nSeed completed!')
  console.log('\nTest accounts:')
  console.log('Admin: admin@matchpoint.com / admin123')
  console.log('User 1: user1@example.com / password123')
  console.log('User 2: user2@example.com / password123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
