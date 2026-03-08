const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// R1 bracket position → seed number of bye player they face in R2
// Derived from the official IW 2026 draw sheets
const ATP_R2_SEED_MAP = {
  1: 1,   // → Alcaraz
  2: 26,  // → Rinderknech
  3: 24,  // → Vacherot
  4: 13,  // → Ruud
  5: 10,  // → Bublik
  6: 20,  // → Darderi
  7: 27,  // → Norrie
  8: 6,   // → de Minaur
  9: 3,   // → Djokovic
  10: 31, // → Moutet
  11: 19, // → F. Cerundolo
  12: 14, // → Draper
  13: 11, // → Medvedev
  14: 22, // → Lehecka
  15: 32, // → Humbert
  16: 7,  // → Fritz
  17: 5,  // → Musetti
  18: 30, // → Fils
  19: 17, // → Rublev
  20: 9,  // → Auger-Aliassime
  21: 15, // → Cobolli
  22: 21, // → Tiafoe
  23: 28, // → Nakashima
  24: 4,  // → Zverev
  25: 8,  // → Shelton
  26: 25, // → Tien
  27: 18, // → Davidovich Fokina
  28: 12, // → Mensik
  29: 16, // → Khachanov
  30: 23, // → Paul
  31: 29, // → Etcheverry
  32: 2,  // → Sinner
};

const WTA_R2_SEED_MAP = {
  1: 1,   // → Sabalenka
  2: 29,  // → Joint
  3: 18,  // → Jovic
  4: 16,  // → Osaka
  5: 10,  // → Mboko
  6: 23,  // → Kalinskaya
  7: 25,  // → Raducanu
  8: 6,   // → Anisimova
  9: 4,   // → Gauff
  10: 31, // → Eala
  11: 21, // → Shnaider
  12: 14, // → Noskova
  13: 11, // → Alexandrova
  14: 17, // → Tauson
  15: 30, // → Wang
  16: 7,  // → Paolini
  17: 5,  // → Pegula
  18: 26, // → Ostapenko
  19: 22, // → Mertens
  20: 12, // → Bencic
  21: 15, // → Keys
  22: 20, // → Navarro
  23: 28, // → Kostyuk
  24: 3,  // → Rybakina
  25: 8,  // → Andreeva
  26: 27, // → Fernandez
  27: 19, // → Samsonova
  28: 9,  // → Svitolina
  29: 13, // → Muchova
  30: 24, // → Zheng
  31: 32, // → Sakkari
  32: 2,  // → Swiatek
};

async function generateR2(tournamentId, label, seedMap) {
  console.log(`\n=== GENERATING R2 FOR ${label} ===`);

  // Get R1 round
  const r1 = await db.round.findFirst({
    where: { tournament: { id: tournamentId }, roundNumber: 1 }
  });
  if (!r1) throw new Error('R1 not found for ' + label);

  // Get R2 round
  const r2 = await db.round.findFirst({
    where: { tournament: { id: tournamentId }, roundNumber: 2 }
  });
  if (!r2) throw new Error('R2 not found for ' + label);

  // Check R2 doesn't already have matches
  const existingR2Matches = await db.match.count({ where: { roundId: r2.id } });
  if (existingR2Matches > 0) {
    console.log('R2 already has ' + existingR2Matches + ' matches, skipping.');
    return;
  }

  // Get R1 completed matches with winners
  const r1Matches = await db.match.findMany({
    where: { roundId: r1.id },
    include: {
      winner: { select: { id: true, name: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });

  const allHaveResults = r1Matches.every(m => m.winnerId);
  console.log('R1 matches: ' + r1Matches.length + ' (all with results: ' + allHaveResults + ')');
  if (!allHaveResults) throw new Error('Not all R1 matches have results');

  // Get all bye players (seeded players not in R1) indexed by seed
  const r1PlayerIds = new Set();
  r1Matches.forEach(m => {
    r1PlayerIds.add(m.player1Id);
    r1PlayerIds.add(m.player2Id);
  });

  const allPlayers = await db.player.findMany({
    where: { tournamentId: tournamentId },
    select: { id: true, name: true, seed: true },
  });

  const byePlayersBySeed = {};
  allPlayers.forEach(p => {
    if (!r1PlayerIds.has(p.id) && p.seed) {
      byePlayersBySeed[p.seed] = p;
    }
  });

  console.log('Bye players with seeds: ' + Object.keys(byePlayersBySeed).length);

  // Create R2 matches: bye seed (player1) vs R1 winner (player2)
  let created = 0;
  for (const r1Match of r1Matches) {
    const bp = r1Match.bracketPosition;
    const seedNum = seedMap[bp];
    if (!seedNum) {
      console.error('  ERROR: No seed mapping for R1 BP' + bp);
      continue;
    }

    const byePlayer = byePlayersBySeed[seedNum];
    if (!byePlayer) {
      console.error('  ERROR: No bye player found for seed ' + seedNum + ' (R1 BP' + bp + ')');
      continue;
    }

    await db.match.create({
      data: {
        roundId: r2.id,
        player1Id: byePlayer.id,    // seeded bye player
        player2Id: r1Match.winnerId, // R1 winner
        bracketPosition: bp,         // same bracket position as R1
      }
    });
    created++;
  }

  console.log('Created ' + created + ' R2 matches');

  // Show R2 matches
  const r2Matches = await db.match.findMany({
    where: { roundId: r2.id },
    include: {
      player1: { select: { name: true, seed: true } },
      player2: { select: { name: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });

  for (const m of r2Matches) {
    const seedLabel = m.player1.seed ? '[' + m.player1.seed + '] ' : '';
    console.log('  BP' + m.bracketPosition + ': ' + seedLabel + m.player1.name + ' vs ' + m.player2.name);
  }
}

async function main() {
  await generateR2('cmma1wmsw00008uujj5u77alz', 'ATP', ATP_R2_SEED_MAP);
  await generateR2('cmma1xsji00088uuju4lwwiv9', 'WTA', WTA_R2_SEED_MAP);

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
