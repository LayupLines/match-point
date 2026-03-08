const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const tournaments = [
  { id: 'cmma1wmsw00008uujj5u77alz', label: 'ATP', r2RoundId: 'cmma1wn6200028uujvhhc5qeg', r3RoundId: 'cmma1wn9e00038uujcd994u8j' },
  { id: 'cmma1xsji00088uuju4lwwiv9', label: 'WTA', r2RoundId: 'cmma1xsly000a8uuj3cvvmq0l', r3RoundId: 'cmma1xsn2000b8uuj0fkzz6h0' },
];

async function generateR3(tournament) {
  console.log(`\n=== GENERATING R3 FOR ${tournament.label} ===`);

  // Check R3 doesn't already have matches
  const existingR3 = await db.match.count({ where: { roundId: tournament.r3RoundId } });
  if (existingR3 > 0) {
    console.log(`R3 already has ${existingR3} matches, skipping.`);
    return;
  }

  // Get R2 completed matches
  const r2Matches = await db.match.findMany({
    where: { roundId: tournament.r2RoundId },
    include: {
      player1: { select: { name: true, seed: true } },
      player2: { select: { name: true, seed: true } },
      winner: { select: { id: true, name: true, seed: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });

  const allComplete = r2Matches.every(m => m.winnerId);
  console.log(`R2 matches: ${r2Matches.length} (all with results: ${allComplete})`);
  if (!allComplete) throw new Error('Not all R2 matches have results');

  // Pair consecutive R2 winners into R3 matches
  let created = 0;
  for (let i = 0; i < r2Matches.length; i += 2) {
    const m1 = r2Matches[i];
    const m2 = r2Matches[i + 1];
    const bp = Math.floor(i / 2) + 1;

    await db.match.create({
      data: {
        roundId: tournament.r3RoundId,
        player1Id: m1.winnerId,
        player2Id: m2.winnerId,
        bracketPosition: bp,
      }
    });
    created++;
  }

  console.log(`Created ${created} R3 matches`);

  // Show R3 matchups
  const r3Matches = await db.match.findMany({
    where: { roundId: tournament.r3RoundId },
    include: {
      player1: { select: { name: true, seed: true } },
      player2: { select: { name: true, seed: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });

  for (const m of r3Matches) {
    const s1 = m.player1.seed ? `[${m.player1.seed}] ` : '';
    const s2 = m.player2.seed ? `[${m.player2.seed}] ` : '';
    console.log(`  BP${m.bracketPosition}: ${s1}${m.player1.name} vs ${s2}${m.player2.name}`);
  }
}

async function main() {
  for (const t of tournaments) {
    await generateR3(t);
  }

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
