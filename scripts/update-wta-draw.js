const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });
  const tid = 'cmma1xsji00088uuju4lwwiv9';

  // Get R1 round
  const r1 = await db.round.findFirst({
    where: { tournamentId: tid, roundNumber: 1 }
  });
  console.log('R1 round:', r1.id, r1.name);

  // Delete all R1 matches
  const deleted = await db.match.deleteMany({ where: { roundId: r1.id } });
  console.log('Deleted', deleted.count, 'R1 matches');

  // Helper to find player by name
  async function findPlayer(name) {
    const p = await db.player.findFirst({ where: { tournamentId: tid, name } });
    if (p === null) {
      console.log('PLAYER NOT FOUND: ' + name);
      return null;
    }
    return p;
  }

  // Real draw R1 matches from the published draw
  // BP = bracket position for auto-bracket generation
  const r1Matches = [
    // === Sabalenka (1) quarter — top half ===
    // Sabalenka section
    { bp: 1, p1: 'Alycia Parks', p2: 'Qualifier 1' },
    { bp: 2, p1: 'Jaqueline Cristian', p2: 'Janice Tjen' },
    // Jovic (18) section
    { bp: 3, p1: 'Sloane Stephens', p2: 'Camila Osorio' },
    { bp: 4, p1: 'Eva Lys', p2: 'Caty McNally' },
    // Mboko (10) section
    { bp: 5, p1: 'Kimberly Birrell', p2: 'Oksana Selekhmeteva' },
    { bp: 6, p1: 'Zeynep Sonmez', p2: 'McCartney Kessler' },
    // Raducanu (25) / Anisimova (6) section
    { bp: 7, p1: 'Ella Seidel', p2: 'Qualifier 2' },
    { bp: 8, p1: 'Anna Blinkova', p2: 'Qualifier 3' },

    // === Gauff (4) quarter — top half ===
    // Gauff / Eala (31) section
    { bp: 9, p1: 'Bianca Andreescu', p2: 'Qualifier 4' },
    { bp: 10, p1: 'Dayana Yastremska', p2: 'Shuai Zhang' },
    // Shnaider (21) / Noskova (14) section
    { bp: 11, p1: 'Sorana Cirstea', p2: 'Tatjana Maria' },
    { bp: 12, p1: 'Jessica Bouzas Maneiro', p2: 'Beatriz Haddad Maia' },
    // Tauson (17) / Alexandrova (11) section — these 2 matches not identified from web sources
    { bp: 13, p1: 'Qualifier 5', p2: 'Qualifier 6' },
    { bp: 14, p1: 'Qualifier 7', p2: 'Qualifier 8' },
    // Wang (30) / Paolini (7) section
    { bp: 15, p1: 'Ajla Tomljanovic', p2: 'Elena-Gabriela Ruse' },
    { bp: 16, p1: 'Anastasia Potapova', p2: 'Qualifier 9' },

    // === Pegula (5) / Rybakina (3) quarter — bottom half ===
    // Pegula / Ostapenko (26) section
    { bp: 17, p1: 'Donna Vekic', p2: 'Tereza Valentova' },
    { bp: 18, p1: 'Katie Volynets', p2: 'Rebecca Sramkova' },
    // Mertens (22) / Bencic (12) section
    { bp: 19, p1: 'Cristina Bucsa', p2: 'Qualifier 10' },
    { bp: 20, p1: 'Qualifier 11', p2: 'Magdalena Frech' },
    // Keys (15) / Navarro (20) section
    { bp: 21, p1: 'Venus Williams', p2: 'Qualifier 12' },
    { bp: 22, p1: 'Sonay Kartal', p2: 'Qualifier 13' },
    // Kostyuk (28) / Rybakina (3) section
    { bp: 23, p1: 'Marie Bouzkova', p2: 'Emiliana Arango' },
    { bp: 24, p1: 'Hailey Baptiste', p2: 'Paula Badosa' },

    // === Andreeva (8) / Swiatek (2) quarter — bottom half ===
    // Andreeva / Fernandez (27) section
    { bp: 25, p1: 'Peyton Stearns', p2: 'Solana Sierra' },
    { bp: 26, p1: 'Katerina Siniakova', p2: 'Sofia Kenin' },
    // Samsonova (19) / Svitolina (9) section
    { bp: 27, p1: 'Magda Linette', p2: 'Ashlyn Krueger' },
    { bp: 28, p1: 'Laura Siegemund', p2: 'Petra Marcinko' },
    // Muchova (13) / Zheng (24) section
    { bp: 29, p1: 'Elsa Jacquemot', p2: 'Anna Bondar' },
    { bp: 30, p1: 'Antonia Ruzic', p2: 'Jennifer Brady' },
    // Sakkari (32) / Swiatek (2) section
    { bp: 31, p1: 'Varvara Gracheva', p2: 'Lilli Tagger' },
    { bp: 32, p1: 'Francesca Jones', p2: 'Yulia Putintseva' },
  ];

  // Create R1 matches
  let created = 0;
  for (const m of r1Matches) {
    const p1 = await findPlayer(m.p1);
    const p2 = await findPlayer(m.p2);
    if (p1 && p2) {
      await db.match.create({
        data: {
          roundId: r1.id,
          player1Id: p1.id,
          player2Id: p2.id,
          bracketPosition: m.bp,
        }
      });
      created++;
      console.log('BP' + m.bp + ': ' + m.p1 + ' vs ' + m.p2);
    } else {
      console.log('SKIPPED BP' + m.bp + ': missing player(s)');
    }
  }

  console.log('\n=== R1 matches created: ' + created + ' of ' + r1Matches.length + ' ===');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
