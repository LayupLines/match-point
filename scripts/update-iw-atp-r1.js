const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  // Find ATP Indian Wells 2026 tournament
  const tournament = await db.tournament.findFirst({
    where: { gender: 'MEN', year: 2026, level: 'ATP_1000' }
  });
  if (!tournament) { console.error('ATP tournament not found'); process.exit(1); }
  const tid = tournament.id;
  console.log('ATP tournament:', tid, tournament.name);

  // Get R1 round
  const r1 = await db.round.findFirst({
    where: { tournamentId: tid, roundNumber: 1 }
  });
  console.log('R1 round:', r1.id, r1.name);

  // === Step 1: Rename qualifier placeholders ===
  const qualifierRenames = [
    { old: 'Qualifier 1', new: 'Sho Shimabukuro', country: 'JPN' },
    { old: 'Qualifier 2', new: 'Francesco Maestrelli', country: 'ITA' },
    { old: 'Qualifier 3', new: 'Rinky Hijikata', country: 'AUS' },
    { old: 'Qualifier 4', new: 'Mackenzie McDonald', country: 'USA' },
    { old: 'Qualifier 5', new: 'Benjamin Bonzi', country: 'FRA' },
    { old: 'Qualifier 6', new: 'Chun-Hsin Tseng', country: 'TPE' },
    { old: 'Qualifier 7', new: 'Daniel Merida', country: 'ESP' },
    { old: 'Qualifier 8', new: 'Christopher O\'Connell', country: 'AUS' },
    { old: 'Qualifier 9', new: 'Dino Prizmic', country: 'CRO' },
    { old: 'Qualifier 10', new: 'Tristan Schoolkate', country: 'AUS' },
    { old: 'Qualifier 11', new: 'Alexis Galarneau', country: 'CAN' },
    { old: 'Qualifier 12', new: 'Dalibor Svrcina', country: 'CZE' },
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
    // === Alcaraz (1) quarter ===
    { bp: 1, p1: 'Terence Atmane', c1: 'FRA', p2: 'Grigor Dimitrov', c2: 'BUL' },
    { bp: 2, p1: 'Juan Manuel Cerundolo', c1: 'ARG', p2: 'Botic van de Zandschulp', c2: 'NED' },
    { bp: 3, p1: 'Nuno Borges', c1: 'POR', p2: 'Emilio Nava', c2: 'USA' },
    { bp: 4, p1: 'Alexander Shevchenko', c1: 'KAZ', p2: 'Sho Shimabukuro', c2: 'JPN' },
    // === Bublik (10) / Ruud (13) section ===
    { bp: 5, p1: 'Michael Zheng', c1: 'USA', p2: 'Arthur Cazaux', c2: 'FRA' },
    { bp: 6, p1: 'Francesco Maestrelli', c1: 'ITA', p2: 'Rinky Hijikata', c2: 'AUS' },
    { bp: 7, p1: 'Matteo Arnaldi', c1: 'ITA', p2: 'Mackenzie McDonald', c2: 'USA' },
    { bp: 8, p1: 'Sebastian Korda', c1: 'USA', p2: 'Francisco Comesana', c2: 'ARG' },

    // === Djokovic (3) / de Minaur (6) quarter ===
    { bp: 9, p1: 'Kamil Majchrzak', c1: 'POL', p2: 'Giovanni Mpetshi Perricard', c2: 'FRA' },
    { bp: 10, p1: 'Hubert Hurkacz', c1: 'POL', p2: 'Aleksandar Kovacevic', c2: 'USA' },
    { bp: 11, p1: 'Valentin Royer', c1: 'FRA', p2: 'Benjamin Bonzi', c2: 'FRA' },
    { bp: 12, p1: 'Fabian Marozsan', c1: 'HUN', p2: 'Roberto Bautista Agut', c2: 'ESP' },
    // === Draper (14) / Medvedev (11) section ===
    { bp: 13, p1: 'Alejandro Tabilo', c1: 'CHI', p2: 'Rafael Jodar', c2: 'ESP' },
    { bp: 14, p1: 'Chun-Hsin Tseng', c1: 'TPE', p2: 'Sebastian Baez', c2: 'ARG' },
    { bp: 15, p1: 'Daniel Merida', c1: 'ESP', p2: 'Alex Michelsen', c2: 'USA' },
    { bp: 16, p1: 'Jacob Fearnley', c1: 'GBR', p2: 'Damir Dzumhur', c2: 'BIH' },

    // === Musetti (5) / Fils (30) / Rublev (17) quarter ===
    { bp: 17, p1: 'Marton Fucsovics', c1: 'HUN', p2: 'Christopher O\'Connell', c2: 'AUS' },
    { bp: 18, p1: 'Dino Prizmic', c1: 'CRO', p2: 'Tristan Schoolkate', c2: 'AUS' },
    { bp: 19, p1: 'Mattia Bellucci', c1: 'ITA', p2: 'Gabriel Diallo', c2: 'CAN' },
    { bp: 20, p1: 'Gael Monfils', c1: 'FRA', p2: 'Alexis Galarneau', c2: 'CAN' },
    // === Cobolli (15) / FAA (9) section ===
    { bp: 21, p1: 'Daniel Altmaier', c1: 'GER', p2: 'Miomir Kecmanovic', c2: 'SRB' },
    { bp: 22, p1: 'Jenson Brooksby', c1: 'USA', p2: 'Alexei Popyrin', c2: 'AUS' },
    { bp: 23, p1: 'Camilo Ugo Carabelli', c1: 'ARG', p2: 'Martin Damm', c2: 'USA' },
    { bp: 24, p1: 'Matteo Berrettini', c1: 'ITA', p2: 'Adrian Mannarino', c2: 'FRA' },

    // === Shelton (8) / Zverev (4) quarter ===
    { bp: 25, p1: 'Reilly Opelka', c1: 'USA', p2: 'Ethan Quinn', c2: 'USA' },
    { bp: 26, p1: 'Quentin Halys', c1: 'FRA', p2: 'Adam Walton', c2: 'AUS' },
    { bp: 27, p1: 'Zachary Svajda', c1: 'USA', p2: 'Marin Cilic', c2: 'CRO' },
    { bp: 28, p1: 'Mariano Navone', c1: 'ARG', p2: 'Marcos Giron', c2: 'USA' },
    // === Khachanov (16) / Mensik (12) section ===
    { bp: 29, p1: 'Joao Fonseca', c1: 'BRA', p2: 'Raphael Collignon', c2: 'BEL' },
    { bp: 30, p1: 'Zizou Bergs', c1: 'BEL', p2: 'Jan-Lennard Struff', c2: 'GER' },
    // === Etcheverry (29) / Paul (23) / Sinner (2) section ===
    { bp: 31, p1: 'Stefanos Tsitsipas', c1: 'GRE', p2: 'Denis Shapovalov', c2: 'CAN' },
    { bp: 32, p1: 'Dalibor Svrcina', c1: 'CZE', p2: 'James Duckworth', c2: 'AUS' },
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

  console.log('\n=== ATP R1 matches created: ' + created + ' of ' + r1Matches.length + ' ===');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
