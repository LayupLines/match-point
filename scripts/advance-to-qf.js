const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// Round IDs
const ATP_R3 = 'cmma1wn9e00038uujcd994u8j';
const ATP_R4 = 'cmma1wncs00048uujalj0643i';
const ATP_QF = 'cmma1wnel00058uuj60ejnjen';
const WTA_R3 = 'cmma1xsn2000b8uuj0fkzz6h0';
const WTA_R4 = 'cmma1xsok000c8uujmkp38bxq';
const WTA_QF = 'cmma1xspo000d8uuj4bzsql1g';

// R3 results: matchId -> winner position (1 or 2)
// "QF determined" = required for QF matchups Jeremy specified
// "default" = higher seed as placeholder (can fix later)
const atpR3Results = {
  'cmmhyph230000pbuv2x1fj3yv': { winner: 1 }, // BP1: Alcaraz (QF determined)
  'cmmhyph300001pbuvavczc2kq': { winner: 2 }, // BP2: Ruud [13] (default)
  'cmmhyph3p0002pbuvn0p51r3w': { winner: 1 }, // BP3: Bublik [10] (default)
  'cmmhyph480003pbuvi4i0wk4q': { winner: 1 }, // BP4: Norrie (QF determined)
  'cmmhyph4v0004pbuvyppxjzcj': { winner: 1 }, // BP5: Djokovic (QF determined)
  'cmmhyph5h0005pbuvkaigvaad': { winner: 2 }, // BP6: Draper [14] (default)
  'cmmhyph620006pbuvxlgz49nj': { winner: 1 }, // BP7: Medvedev (QF determined)
  'cmmhyph6m0007pbuvtyif310b': { winner: 2 }, // BP8: Fritz [7] (default)
  'cmmhyph740008pbuvamct880z': { winner: 2 }, // BP9: Fils [30] (QF determined)
  'cmmhyph7m0009pbuvcbfr5570': { winner: 2 }, // BP10: FAA [9] (default)
  'cmmhyph82000apbuv1przgffq': { winner: 1 }, // BP11: Cobolli [15] (default)
  'cmmhyph8l000bpbuv91fpkryy': { winner: 2 }, // BP12: Zverev [4] (QF determined)
  'cmmhyph96000cpbuvb9niz71q': { winner: 2 }, // BP13: Tien [25] (QF determined)
  'cmmhyph9o000dpbuv5t9c9g83': { winner: 2 }, // BP14: Mensik [12] (default)
  'cmmhypha6000epbuvex5mlxlm': { winner: 2 }, // BP15: Paul [23] (default)
  'cmmhyphar000fpbuv2fs7iit7': { winner: 2 }, // BP16: Sinner [2] (QF determined)
};

const wtaR3Results = {
  'cmmhypheu000gpbuvgzdr6ovr': { winner: 1 }, // BP1: Sabalenka (QF determined)
  'cmmhyphfb000hpbuvfzqmhy2w': { winner: 2 }, // BP2: Osaka [16] (default)
  'cmmhyphfz000ipbuvk110fuat': { winner: 1 }, // BP3: Mboko [10] (QF determined)
  'cmmhyphgf000jpbuvuoq81ts3': { winner: 2 }, // BP4: Anisimova [6] (default)
  'cmmhyphh8000kpbuvjebgnniy': { winner: 1 }, // BP5: Gauff [4] (default)
  'cmmhyphhr000lpbuvw27qi221': { winner: 2 }, // BP6: Noskova [14] (QF determined)
  'cmmhyphin000mpbuvmwwgtzk3': { winner: 1 }, // BP7: Gibson (QF determined)
  'cmmhyphj9000npbuvnsoc4mps': { winner: 2 }, // BP8: Paolini [7] (default)
  'cmmhyphk4000opbuvpxrolaoo': { winner: 1 }, // BP9: Pegula [5] (QF determined)
  'cmmhyphkq000ppbuvexdiqizh': { winner: 2 }, // BP10: Bencic [12] (default)
  'cmmhyphla000qpbuve73pltcr': { winner: 1 }, // BP11: Keys [15] (default)
  'cmmhyphlw000rpbuvzcatq11s': { winner: 2 }, // BP12: Rybakina [3] (QF determined)
  'cmmhyphmg000spbuvoe7hv3tj': { winner: 1 }, // BP13: Andreeva [8] (default)
  'cmmhyphmz000tpbuvjrc0mwij': { winner: 2 }, // BP14: Svitolina [9] (QF determined)
  'cmmhyphnh000upbuv8wsg434u': { winner: 1 }, // BP15: Muchova [13] (default)
  'cmmhyphnz000vpbuv3lqehcj2': { winner: 2 }, // BP16: Swiatek [2] (QF determined)
};

// R4 results: winner position (1 or 2) — all QF-determined
// P1 = odd BP R3 winner, P2 = even BP R3 winner
const atpR4Winners = [
  1, // BP1: Alcaraz (p1) def. Ruud
  2, // BP2: Norrie (p2) def. Bublik
  1, // BP3: Djokovic (p1) def. Draper
  1, // BP4: Medvedev (p1) def. Fritz
  1, // BP5: Fils (p1) def. FAA
  2, // BP6: Zverev (p2) def. Cobolli
  1, // BP7: Tien (p1) def. Mensik
  2, // BP8: Sinner (p2) def. Paul
];

const wtaR4Winners = [
  1, // BP1: Sabalenka (p1) def. Osaka
  1, // BP2: Mboko (p1) def. Anisimova
  2, // BP3: Noskova (p2) def. Gauff
  1, // BP4: Gibson (p1) def. Paolini
  1, // BP5: Pegula (p1) def. Bencic
  2, // BP6: Rybakina (p2) def. Keys
  2, // BP7: Svitolina (p2) def. Andreeva
  2, // BP8: Swiatek (p2) def. Muchova
];

async function enterResults(label, results) {
  console.log(`\n=== ENTERING ${label} RESULTS ===`);
  let entered = 0;
  for (const [matchId, result] of Object.entries(results)) {
    const match = await db.match.findUnique({
      where: { id: matchId },
      select: { player1Id: true, player2Id: true, bracketPosition: true },
    });
    const winnerId = result.winner === 1 ? match.player1Id : match.player2Id;
    await db.match.update({
      where: { id: matchId },
      data: { winnerId, resultEnteredAt: new Date() },
    });
    entered++;
    process.stdout.write('.');
  }
  console.log(`\n${label}: ${entered} results entered`);
  return entered;
}

async function generateNextRound(label, sourceRoundId, targetRoundId) {
  console.log(`\n=== GENERATING ${label} ===`);

  const existing = await db.match.count({ where: { roundId: targetRoundId } });
  if (existing > 0) {
    console.log(`Already has ${existing} matches, skipping.`);
    return existing;
  }

  const matches = await db.match.findMany({
    where: { roundId: sourceRoundId },
    include: {
      player1: { select: { name: true, seed: true } },
      player2: { select: { name: true, seed: true } },
      winner: { select: { id: true, name: true, seed: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });

  if (matches.some(m => !m.winnerId)) throw new Error(`Not all ${label} source matches have results`);

  let created = 0;
  for (let i = 0; i < matches.length; i += 2) {
    const bp = Math.floor(i / 2) + 1;
    await db.match.create({
      data: {
        roundId: targetRoundId,
        player1Id: matches[i].winnerId,
        player2Id: matches[i + 1].winnerId,
        bracketPosition: bp,
      },
    });
    created++;
  }
  console.log(`Created ${created} matches`);
  return created;
}

async function enterR4Results(label, roundId, winners) {
  console.log(`\n=== ENTERING ${label} R4 RESULTS ===`);
  const matches = await db.match.findMany({
    where: { roundId },
    orderBy: { bracketPosition: 'asc' },
  });

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const winnerId = winners[i] === 1 ? m.player1Id : m.player2Id;
    await db.match.update({
      where: { id: m.id },
      data: { winnerId, resultEnteredAt: new Date() },
    });
    process.stdout.write('.');
  }
  console.log(`\n${label}: ${matches.length} results entered`);
}

async function printMatchups(label, roundId) {
  const matches = await db.match.findMany({
    where: { roundId },
    include: {
      player1: { select: { name: true, seed: true } },
      player2: { select: { name: true, seed: true } },
    },
    orderBy: { bracketPosition: 'asc' },
  });
  console.log(`\n${label} matchups:`);
  for (const m of matches) {
    const s1 = m.player1.seed ? `[${m.player1.seed}] ` : '';
    const s2 = m.player2.seed ? `[${m.player2.seed}] ` : '';
    console.log(`  BP${m.bracketPosition}: ${s1}${m.player1.name} vs ${s2}${m.player2.name}`);
  }
}

async function main() {
  // Step 1: Enter R3 results
  await enterResults('ATP R3', atpR3Results);
  await enterResults('WTA R3', wtaR3Results);

  // Step 2: Generate R4 (Round of 16)
  await generateNextRound('ATP R4', ATP_R3, ATP_R4);
  await generateNextRound('WTA R4', WTA_R3, WTA_R4);

  // Step 3: Enter R4 results
  await enterR4Results('ATP', ATP_R4, atpR4Winners);
  await enterR4Results('WTA', WTA_R4, wtaR4Winners);

  // Step 4: Generate QF
  await generateNextRound('ATP QF', ATP_R4, ATP_QF);
  await generateNextRound('WTA QF', WTA_R4, WTA_QF);

  // Print QF matchups for verification
  await printMatchups('ATP QF', ATP_QF);
  await printMatchups('WTA QF', WTA_QF);

  console.log('\n=== DONE ===');
  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
