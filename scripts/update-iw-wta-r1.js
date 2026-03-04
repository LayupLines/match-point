const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  // Find WTA Indian Wells 2026 tournament
  const tournament = await db.tournament.findFirst({
    where: { gender: 'WOMEN', year: 2026, level: 'WTA_1000' }
  });
  if (!tournament) { console.error('WTA tournament not found'); process.exit(1); }
  const tid = tournament.id;
  console.log('WTA tournament:', tid, tournament.name);

  // Get R1 round
  const r1 = await db.round.findFirst({
    where: { tournamentId: tid, roundNumber: 1 }
  });
  console.log('R1 round:', r1.id, r1.name);

  // === Step 1: Rename qualifier placeholders ===
  const qualifierRenames = [
    { old: 'Qualifier 1', new: 'Himeno Sakatsume', country: 'JPN' },
    { old: 'Qualifier 2', new: 'Victoria Jimenez Kasintseva', country: 'AND' },
    { old: 'Qualifier 3', new: 'Anastasia Zakharova', country: 'RUS' },
    { old: 'Qualifier 4', new: 'Kamilla Rakhimova', country: 'UZB' },
    { old: 'Qualifier 5', new: 'Talia Gibson', country: 'AUS' },
    { old: 'Qualifier 6', new: 'Marina Stakusic', country: 'CAN' },
    { old: 'Qualifier 7', new: 'Darja Vidmanova', country: 'CZE' },
    { old: 'Qualifier 8', new: 'Storm Hunter', country: 'AUS' },
    { old: 'Qualifier 9', new: 'Diane Parry', country: 'FRA' },
    { old: 'Qualifier 10', new: 'Lanlana Tararudee', country: 'THA' },
    { old: 'Qualifier 11', new: 'Taylor Townsend', country: 'USA' },
    { old: 'Qualifier 12', new: 'Kayla Day', country: 'USA' },
    { old: 'Qualifier 13', new: 'Dalma Galfi', country: 'HUN' },
  ];

  let renamed = 0;
  for (const q of qualifierRenames) {
    const player = await db.player.findFirst({ where: { tournamentId: tid, name: q.old } });
    if (player) {
      await db.player.update({
        where: { id: player.id },
        data: { name: q.new, country: q.country },
      });
      console.log('Renamed: ' + q.old + ' → ' + q.new);
      renamed++;
    } else {
      console.log('NOT FOUND for rename: ' + q.old);
    }
  }
  console.log('Renamed ' + renamed + ' qualifiers\n');

  // === Step 2: Delete all R1 matches ===
  const deleted = await db.match.deleteMany({ where: { roundId: r1.id } });
  console.log('Deleted ' + deleted.count + ' R1 matches\n');

  // === Step 3: Ensure all players exist, create if missing ===
  async function ensurePlayer(name, country) {
    let p = await db.player.findFirst({ where: { tournamentId: tid, name } });
    if (!p) {
      p = await db.player.create({ data: { tournamentId: tid, name, country } });
      console.log('CREATED player: ' + name + ' (' + country + ')');
    }
    return p;
  }

  // === Step 4: Create all 32 R1 matches from official PDF draw ===
  const r1Matches = [
    // === Sabalenka (1) quarter ===
    { bp: 1, p1: 'Himeno Sakatsume', c1: 'JPN', p2: 'Alycia Parks', c2: 'USA' },
    { bp: 2, p1: 'Jaqueline Cristian', c1: 'ROU', p2: 'Janice Tjen', c2: 'INA' },
    { bp: 3, p1: 'Sloane Stephens', c1: 'USA', p2: 'Camila Osorio', c2: 'COL' },
    { bp: 4, p1: 'Victoria Jimenez Kasintseva', c1: 'AND', p2: 'Caty McNally', c2: 'USA' },
    // === Osaka (16) / Mboko (10) section ===
    { bp: 5, p1: 'Kimberly Birrell', c1: 'AUS', p2: 'Oksana Selekhmeteva', c2: 'RUS' },
    { bp: 6, p1: 'Zeynep Sonmez', c1: 'TUR', p2: 'McCartney Kessler', c2: 'USA' },
    // === Raducanu (25) / Anisimova (6) section ===
    { bp: 7, p1: 'Ella Seidel', c1: 'GER', p2: 'Anastasia Zakharova', c2: 'RUS' },
    { bp: 8, p1: 'Dalma Galfi', c1: 'HUN', p2: 'Anna Blinkova', c2: 'RUS' },

    // === Gauff (4) quarter ===
    { bp: 9, p1: 'Bianca Andreescu', c1: 'CAN', p2: 'Kamilla Rakhimova', c2: 'UZB' },
    { bp: 10, p1: 'Dayana Yastremska', c1: 'UKR', p2: 'Shuai Zhang', c2: 'CHN' },
    // === Shnaider (21) / Noskova (14) section ===
    { bp: 11, p1: 'Sorana Cirstea', c1: 'ROU', p2: 'Tatjana Maria', c2: 'GER' },
    { bp: 12, p1: 'Jessica Bouzas Maneiro', c1: 'ESP', p2: 'Beatriz Haddad Maia', c2: 'BRA' },
    // === Alexandrova (11) / Tauson (17) section ===
    { bp: 13, p1: 'Talia Gibson', c1: 'AUS', p2: 'Ann Li', c2: 'USA' },
    { bp: 14, p1: 'Yulia Putintseva', c1: 'KAZ', p2: 'Paula Badosa', c2: 'ESP' },
    // === Wang (30) / Paolini (7) section ===
    { bp: 15, p1: 'Ajla Tomljanovic', c1: 'AUS', p2: 'Elena-Gabriela Ruse', c2: 'ROU' },
    { bp: 16, p1: 'Anastasia Potapova', c1: 'AUT', p2: 'Marina Stakusic', c2: 'CAN' },

    // === Pegula (5) / Ostapenko (26) quarter ===
    { bp: 17, p1: 'Donna Vekic', c1: 'CRO', p2: 'Tereza Valentova', c2: 'CZE' },
    { bp: 18, p1: 'Katie Volynets', c1: 'USA', p2: 'Rebecca Sramkova', c2: 'SVK' },
    // === Mertens (22) / Bencic (12) section ===
    { bp: 19, p1: 'Cristina Bucsa', c1: 'ESP', p2: 'Darja Vidmanova', c2: 'CZE' },
    { bp: 20, p1: 'Storm Hunter', c1: 'AUS', p2: 'Magdalena Frech', c2: 'POL' },
    // === Keys (15) / Navarro (20) section ===
    { bp: 21, p1: 'Diane Parry', c1: 'FRA', p2: 'Venus Williams', c2: 'USA' },
    { bp: 22, p1: 'Lanlana Tararudee', c1: 'THA', p2: 'Sonay Kartal', c2: 'GBR' },
    // === Kostyuk (28) / Rybakina (3) section ===
    { bp: 23, p1: 'Marie Bouzkova', c1: 'CZE', p2: 'Taylor Townsend', c2: 'USA' },
    { bp: 24, p1: 'Emiliana Arango', c1: 'COL', p2: 'Hailey Baptiste', c2: 'USA' },

    // === Andreeva (8) / Fernandez (27) quarter ===
    { bp: 25, p1: 'Peyton Stearns', c1: 'USA', p2: 'Solana Sierra', c2: 'ARG' },
    { bp: 26, p1: 'Katerina Siniakova', c1: 'CZE', p2: 'Sofia Kenin', c2: 'USA' },
    // === Samsonova (19) / Svitolina (9) section ===
    { bp: 27, p1: 'Magda Linette', c1: 'POL', p2: 'Ashlyn Krueger', c2: 'USA' },
    { bp: 28, p1: 'Laura Siegemund', c1: 'GER', p2: 'Petra Marcinko', c2: 'CRO' },
    // === Muchova (13) / Zheng (24) section ===
    { bp: 29, p1: 'Elsa Jacquemot', c1: 'FRA', p2: 'Anna Bondar', c2: 'HUN' },
    { bp: 30, p1: 'Antonia Ruzic', c1: 'CRO', p2: 'Jennifer Brady', c2: 'USA' },
    // === Sakkari (32) / Swiatek (2) section ===
    { bp: 31, p1: 'Varvara Gracheva', c1: 'FRA', p2: 'Lilli Tagger', c2: 'AUT' },
    { bp: 32, p1: 'Francesca Jones', c1: 'GBR', p2: 'Kayla Day', c2: 'USA' },
  ];

  let created = 0;
  for (const m of r1Matches) {
    const p1 = await ensurePlayer(m.p1, m.c1);
    const p2 = await ensurePlayer(m.p2, m.c2);
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
  }

  console.log('\n=== WTA R1 matches created: ' + created + ' of ' + r1Matches.length + ' ===');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
