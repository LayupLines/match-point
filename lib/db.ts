import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
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

  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
