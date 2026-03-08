const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ATP R2 results: matchId -> which player won (1 = bye seed, 2 = R1 winner)
// Sources: atptour.com draws + results pages
const atpR2Results = {
  // BP1: Alcaraz [1] def. Dimitrov
  'cmmezapmy0000kuuv0jpuo7w9': { winner: 1 },
  // BP2: Rinderknech [26] def. J.M. Cerundolo (WALKOVER)
  'cmmezapnu0001kuuvofz4v48s': { winner: 1, isWalkover: true },
  // BP3: Vacherot [24] def. Borges
  'cmmezapox0002kuuv4uzdcves': { winner: 1 },
  // BP4: Ruud [13] def. Shevchenko
  'cmmezappk0003kuuvrphjqg42': { winner: 1 },
  // BP5: Bublik [10] def. Kopriva
  'cmmezapq30004kuuvhidup4e7': { winner: 1 },
  // BP6: Hijikata def. Darderi [20] (upset)
  'cmmezapqr0005kuuvrdaf4yky': { winner: 2 },
  // BP7: Norrie [27] def. McDonald
  'cmmezapra0006kuuvv70yt4vi': { winner: 1 },
  // BP8: de Minaur [6] def. Korda
  'cmmezaprt0007kuuvd1nvuv30': { winner: 1 },
  // BP9: Djokovic [3] def. Majchrzak
  'cmmezapsi0008kuuv9xd3gdk7': { winner: 1 },
  // BP10: Kovacevic def. Moutet [31] (upset)
  'cmmezaptt0009kuuvvjcr34uo': { winner: 2 },
  // BP11: F. Cerundolo [19] def. Bonzi
  'cmmezapuf000akuuvbmo2076a': { winner: 1 },
  // BP12: Draper [14] def. Bautista Agut
  'cmmezapuz000bkuuvbsk4bxov': { winner: 1 },
  // BP13: Medvedev [11] def. Tabilo
  'cmmezapvj000ckuuvv0r9my9g': { winner: 1 },
  // BP14: Baez def. Lehecka [22] (upset)
  'cmmezapw8000dkuuvq96muuce': { winner: 2 },
  // BP15: Michelsen def. Humbert [32] (upset)
  'cmmezapww000ekuuv0pg6o33h': { winner: 2 },
  // BP16: Fritz [7] def. Fearnley
  'cmmezapxh000fkuuvj9qzlqp7': { winner: 1 },
  // BP17: Fucsovics def. Musetti [5] (upset)
  'cmmezapxx000gkuuv3o6orncd': { winner: 2 },
  // BP18: Fils [30] def. Prizmic
  'cmmezapyk000hkuuv3onci2f9': { winner: 1 },
  // BP19: Diallo def. Rublev [17] (upset)
  'cmmezapz2000ikuuv4zenjpt3': { winner: 2 },
  // BP20: Auger-Aliassime [9] def. Monfils
  'cmmezapzm000jkuuvog63re6r': { winner: 1 },
  // BP21: Cobolli [15] def. Kecmanovic
  'cmmezaq0j000kkuuvp9o637y0': { winner: 1 },
  // BP22: Tiafoe [21] def. Brooksby
  'cmmezaq1h000lkuuvlre2b5hk': { winner: 1 },
  // BP23: Nakashima [28] def. Ugo Carabelli
  'cmmezaq23000mkuuvso4o38o3': { winner: 1 },
  // BP24: Zverev [4] def. Berrettini
  'cmmezaq2m000nkuuvkkfmzdef': { winner: 1 },
  // BP25: Shelton [8] def. Opelka
  'cmmezaq39000okuuvu7relg90': { winner: 1 },
  // BP26: Tien [25] def. Walton
  'cmmezaq3x000pkuuv2vc6a6a3': { winner: 1 },
  // BP27: Davidovich Fokina [18] def. Svajda
  'cmmezaq4h000qkuuvmm632zoz': { winner: 1 },
  // BP28: Mensik [12] def. Giron
  'cmmezaq4y000rkuuvoahweb95': { winner: 1 },
  // BP29: Fonseca def. Khachanov [16] (upset)
  'cmmezaq5l000skuuvwu3lpjyg': { winner: 2 },
  // BP30: Paul [23] def. Bergs
  'cmmezaq6c000tkuuvo1q2co56': { winner: 1 },
  // BP31: Shapovalov def. Etcheverry [29] (upset)
  'cmmezaq6s000ukuuvk4qoqqg6': { winner: 2 },
  // BP32: Sinner [2] def. Svrcina
  'cmmezaq78000vkuuvkr7o4md0': { winner: 1 },
};

// WTA R2 results: matchId -> which player won (1 = bye seed, 2 = R1 winner)
// Sources: tennisexplorer.com + liquipedia.net (cross-verified)
const wtaR2Results = {
  // BP1: Sabalenka [1] def. Sakatsume
  'cmmezaqg5000wkuuv1gogjd52': { winner: 1 },
  // BP2: Cristian def. Joint [29] (upset)
  'cmmezaqgm000xkuuvvm8btn1g': { winner: 2 },
  // BP3: Osorio def. Jovic [18] (upset)
  'cmmezaqh4000ykuuvmf8fkeog': { winner: 2 },
  // BP4: Osaka [16] def. Jimenez Kasintseva
  'cmmezaqhl000zkuuvq5acm5d9': { winner: 1 },
  // BP5: Mboko [10] def. Birrell
  'cmmezaqi10010kuuv5pp5g9vz': { winner: 1 },
  // BP6: Kalinskaya [23] def. Sonmez
  'cmmezaqis0011kuuvl7vb916u': { winner: 1 },
  // BP7: Raducanu [25] def. Zakharova
  'cmmezaqj80012kuuv0xqawybh': { winner: 1 },
  // BP8: Anisimova [6] def. Blinkova
  'cmmezaqjo0013kuuvn67dq4vv': { winner: 1 },
  // BP9: Gauff [4] def. Rakhimova
  'cmmezaqk40014kuuvreg37h00': { winner: 1 },
  // BP10: Eala [31] def. Yastremska
  'cmmezaqkm0015kuuvskcxey4c': { winner: 1 },
  // BP11: Cirstea def. Shnaider [21] (upset)
  'cmmezaql30016kuuvot5raql7': { winner: 2 },
  // BP12: Noskova [14] def. Bouzas Maneiro
  'cmmezaqlj0017kuuvprw0rcea': { winner: 1 },
  // BP13: Gibson def. Alexandrova [11] (upset)
  'cmmezaqm00018kuuvs4cr6wy5': { winner: 2 },
  // BP14: Tauson [17] def. Putintseva
  'cmmezaqmh0019kuuv11ni1xat': { winner: 1 },
  // BP15: Tomljanovic def. Wang [30] (upset)
  'cmmezaqmv001akuuv0cv27lbq': { winner: 2 },
  // BP16: Paolini [7] def. Potapova
  'cmmezaqnc001bkuuv1jgo2rr5': { winner: 1 },
  // BP17: Pegula [5] def. Vekic
  'cmmezaqnt001ckuuvunatmy6s': { winner: 1 },
  // BP18: Ostapenko [26] def. Volynets
  'cmmezaqoa001dkuuvqhsoyuhc': { winner: 1 },
  // BP19: Mertens [22] def. Bucsa
  'cmmezaqqu001ekuuv6hoiany5': { winner: 1 },
  // BP20: Bencic [12] def. Hunter
  'cmmezaqrb001fkuuvi2kbhuwz': { winner: 1 },
  // BP21: Keys [15] def. Parry
  'cmmezaqry001gkuuvlrsi397q': { winner: 1 },
  // BP22: Kartal def. Navarro [20] (upset)
  'cmmezaqsi001hkuuvaz7f30o1': { winner: 2 },
  // BP23: Kostyuk [28] def. Townsend
  'cmmezaqt5001ikuuvs83p2omp': { winner: 1 },
  // BP24: Rybakina [3] def. Baptiste
  'cmmezaqtt001jkuuvfud208dc': { winner: 1 },
  // BP25: Andreeva [8] def. Sierra
  'cmmezaquc001kkuuv2pubf56l': { winner: 1 },
  // BP26: Siniakova def. Fernandez [27] (upset)
  'cmmezaqvr001lkuuvpyko70db': { winner: 2 },
  // BP27: Krueger def. Samsonova [19] (upset)
  'cmmezaqwd001mkuuvezl6yubj': { winner: 2 },
  // BP28: Svitolina [9] def. Siegemund
  'cmmezaqwx001nkuuvuzb9ya9s': { winner: 1 },
  // BP29: Muchova [13] def. Bondar
  'cmmezaqxg001okuuvwyxy0rjq': { winner: 1 },
  // BP30: Ruzic def. Zheng [24] (upset)
  'cmmezaqxx001pkuuvrm05zaiv': { winner: 2 },
  // BP31: Sakkari [32] def. Tagger
  'cmmezaqyg001qkuuv7pd7qu7f': { winner: 1 },
  // BP32: Swiatek [2] def. Day
  'cmmezaqz5001rkuuvyrbr0nq0': { winner: 1 },
};

async function enterResults(label, results) {
  console.log(`\n=== ENTERING ${label} R2 RESULTS ===`);
  let entered = 0;
  let errors = 0;

  for (const [matchId, result] of Object.entries(results)) {
    try {
      const match = await db.match.findUnique({
        where: { id: matchId },
        select: { player1Id: true, player2Id: true, bracketPosition: true },
      });

      if (!match) {
        console.error(`\n  Match ${matchId} not found!`);
        errors++;
        continue;
      }

      const winnerId = result.winner === 1 ? match.player1Id : match.player2Id;
      const updateData = {
        winnerId,
        resultEnteredAt: new Date(),
      };
      if (result.isWalkover) updateData.isWalkover = true;

      await db.match.update({
        where: { id: matchId },
        data: updateData,
      });

      entered++;
      process.stdout.write('.');
    } catch (err) {
      console.error(`\n  Error for match ${matchId}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n${label}: ${entered} results entered, ${errors} errors`);
  return { entered, errors };
}

async function main() {
  const atpResult = await enterResults('ATP', atpR2Results);
  const wtaResult = await enterResults('WTA', wtaR2Results);

  // Verify
  const atpR2 = await db.round.findFirst({
    where: { tournament: { id: 'cmma1wmsw00008uujj5u77alz' }, roundNumber: 2 }
  });
  const wtaR2 = await db.round.findFirst({
    where: { tournament: { id: 'cmma1xsji00088uuju4lwwiv9' }, roundNumber: 2 }
  });

  const atpCompleted = await db.match.count({ where: { roundId: atpR2.id, winnerId: { not: null } } });
  const atpPending = await db.match.count({ where: { roundId: atpR2.id, winnerId: null } });
  const wtaCompleted = await db.match.count({ where: { roundId: wtaR2.id, winnerId: { not: null } } });
  const wtaPending = await db.match.count({ where: { roundId: wtaR2.id, winnerId: null } });

  console.log('\n=== VERIFICATION ===');
  console.log(`ATP R2: ${atpCompleted} completed, ${atpPending} pending`);
  console.log(`WTA R2: ${wtaCompleted} completed, ${wtaPending} pending`);

  const total = atpResult.entered + wtaResult.entered;
  const totalErrors = atpResult.errors + wtaResult.errors;
  console.log(`\nTotal: ${total} results entered, ${totalErrors} errors`);

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
