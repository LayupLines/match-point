const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

// ATP R1 results: matchId -> winnerId
// Based on official ATP results from atptour.com
const atpResults = {
  // BP1: Dimitrov def. Atmane
  'cmmbkqus40000jauj86th2bwe': 'cmma2dj0b001d8uujraak5q8p', // Grigor Dimitrov
  // BP2: Cerundolo def. Van de Zandschulp
  'cmmbkquy70002jaujoq3vgec3': 'cmma2dj1f001e8uuj5ozd31ou', // Juan Manuel Cerundolo
  // BP3: Borges def. Nava
  'cmmbkqv1u0003jaujjr9agcny': 'cmma2dj3p001g8uujyae67w97', // Nuno Borges
  // BP4: Shevchenko def. Shimabukuro
  'cmmbkqv7n0004jaujiduba9xq': 'cmma2dj5y001i8uuj287m24hm', // Alexander Shevchenko
  // BP5: Kopriva def. Zheng — but Cazaux is player2 in our DB, not Zheng... checking
  // DB has: Michael Zheng vs Arthur Cazaux. Result: Kopriva def. Zheng. But Kopriva isn't in this match!
  // Actually wait — the ATP result says "Vit Kopriva def. Michael Zheng". But our match has Zheng vs Cazaux.
  // This means our draw might be slightly different. Let me check the actual result for Zheng vs Cazaux match.
  // The search results show Kopriva def. Zheng — but that might be a different bracket position.
  // Our BP5 is Zheng vs Cazaux. The ATP results page doesn't show Cazaux specifically.
  // Looking at the full results list: no Cazaux result found. Let me check if Cazaux was a walkover or if our draw is wrong.
  // For now, skip this one and handle manually later.

  // BP6: Hijikata def. Maestrelli
  'cmmbkqvg90006jaujab03fy31': 'cmma2dkqn002u8uujc81qxdu1', // Rinky Hijikata
  // BP7: McDonald def. Arnaldi
  'cmmbkqvms0007jaujaet4phbd': 'cmma2dkro002v8uujt1p98huw', // Mackenzie McDonald
  // BP8: Korda def. Comesana
  'cmmbkqvsd0008jaujlmk8a7se': 'cmma2djam001m8uuj9fbc4wue', // Sebastian Korda
  // BP9: Majchrzak def. Mpetshi Perricard
  'cmmbkqvw70009jaujdma6acti': 'cmma2djcz001o8uujfplbt5fe', // Kamil Majchrzak
  // BP10: Kovacevic def. Hurkacz
  'cmmbkqvzw000ajauj6t2zdw6r': 'cmma2djg9001r8uujx5kk5q9g', // Aleksandar Kovacevic
  // BP11: Bonzi def. Royer
  'cmmbkqw3y000bjaujssvsk7jj': 'cmma2dkst002w8uujvb5amcbf', // Benjamin Bonzi
  // BP12: Bautista Agut def. Marozsan
  'cmmbkqw8p000cjaujxyc4ul20': 'cmma2djjy001u8uujsbr31jx2', // Roberto Bautista Agut
  // BP13: Tabilo def. Jodar
  'cmmbkqwcd000djauj8yl2qh77': 'cmma2djl7001v8uuj94lyox0o', // Alejandro Tabilo
  // BP14: Baez def. Tseng
  'cmmbkqwh7000ejaujkjr1sv5m': 'cmma2djnd001x8uujrcmd7hns', // Sebastian Baez
  // BP15: Michelsen def. Merida
  'cmmbkqwl2000fjaujdcd6x3fb': 'cmma2djof001y8uuj3vi0ltvo', // Alex Michelsen
  // BP16: Fearnley def. Dzumhur
  'cmmbkqwp4000gjaujdrc2i8y4': 'cmma2djpm001z8uujeqakcgt7', // Jacob Fearnley
  // BP17: Fucsovics def. O'Connell
  'cmmbkqwst000hjaujm52rzzp6': 'cmma2djrq00218uuj8l5udgll', // Marton Fucsovics
  // BP18: Prizmic def. Schoolkate
  'cmmbkqwx7000ijauj2k1o3bpx': 'cmma2dkxb00308uujsdmdq37t', // Dino Prizmic
  // BP19: Diallo def. Bellucci
  'cmmbkqx10000jjauj8givi2on': 'cmma2djtz00238uujqmdfyn30', // Gabriel Diallo
  // BP20: Monfils def. Galarneau
  'cmmbkqx4m000kjaujlpi6ge9w': 'cmma2djw300248uujeweon28l', // Gael Monfils
  // BP21: Kecmanovic def. Altmaier (6-3, 1-0 RET — Altmaier retired)
  'cmmbkqx8j000ljaujaprg09rv': 'cmma2djya00268uujs4rs5zv4', // Miomir Kecmanovic
  // BP22: Brooksby def. Popyrin
  'cmmbkqxch000mjaujg91i8cp5': 'cmma2dk0g00278uujk629f56b', // Jenson Brooksby
  // BP23: Ugo Carabelli def. Damm
  'cmmbkqxgm000njaujg840233x': 'cmma2dk2u00298uujonn1id8f', // Camilo Ugo Carabelli
  // BP24: Berrettini def. Mannarino
  'cmmbkqxk9000ojaujufscj039': 'cmma2dk53002b8uujs4nyzpfm', // Matteo Berrettini
  // BP25: Opelka def. Quinn
  'cmmbkqxo1000pjaujkb1fvqv6': 'cmma2dk7g002d8uuj39idzxhd', // Reilly Opelka
  // BP26: Walton def. Halys
  'cmmbkqxrl000qjaujr7cghw7f': 'cmma2dkb4002g8uujwrhw2tsa', // Adam Walton
  // BP27: Svajda def. Cilic
  'cmmbkqxv3000rjaujo35588tb': 'cmma2dkc9002h8uuj05hsy938', // Zachary Svajda
  // BP28: Giron def. Navone
  'cmmbkqxyn000sjaujwql5zi5t': 'cmma2dkfi002k8uujswafsl7a', // Marcos Giron
  // BP29: Fonseca def. Collignon
  'cmmbkqy2a000tjaujk7xr7iov': 'cmma2dkgk002l8uujyhoa0cy9', // Joao Fonseca
  // BP30: Bergs def. Struff
  'cmmbkqy5s000ujaujc6wo76wm': 'cmma2dkis002n8uujx841em3s', // Zizou Bergs
  // BP31: Shapovalov def. Tsitsipas
  'cmmbkqy9o000vjaujj37lg57y': 'cmma2dkm5002q8uujz58qdbv1', // Denis Shapovalov
  // BP32: Svrcina def. Duckworth
  'cmmbkqydr000wjaujl4d3x0km': 'cmma2dl0k00338uujprpsjqzy', // Dalibor Svrcina
};

// BP5 fix: Cazaux withdrew, replaced by Kopriva (Lucky Loser). Kopriva def. Zheng.
// We need to: 1) Create/find Kopriva, 2) Update player2 on the match, 3) Set winner
// This is handled separately below.

// Retirement info
const atpRetirements = {
  // BP21: Altmaier retired (6-3, 1-0 RET)
  'cmmbkqx8j000ljaujaprg09rv': 'cmma2djx600258uujq773u8i3', // Daniel Altmaier retired
};

// WTA R1 results: matchId -> winnerId
// Based on Liquipedia results
const wtaResults = {
  // BP1: Sakatsume def. Parks
  'cmmbkq4e50000fbujvzghjzkc': 'cmma2ljlz006b8uujwu2j117s', // Himeno Sakatsume
  // BP2: Cristian def. Tjen
  'cmmbkq4i00001fbuji871wksp': 'cmma2lhto004x8uuj03pa58ph', // Jaqueline Cristian
  // BP3: Osorio def. Stephens
  'cmmbkq4m00002fbuj3pnps7gi': 'cmma2lhx900508uujou5rfm08', // Camila Osorio
  // BP4: Jimenez Kasintseva def. McNally
  'cmmbkq4pq0003fbuj7r7cjezf': 'cmma2ljn5006c8uujz32nhhmi', // Victoria Jimenez Kasintseva
  // BP5: Birrell def. Selekhmeteva
  'cmmbkq4vb0004fbujhyeihr1k': 'cmma2li1500538uuj2ctdyi5i', // Kimberly Birrell
  // BP6: Sonmez def. Kessler
  'cmmbkq4yv0005fbujpk8owd92': 'cmma2li5c00558uuj9npaujti', // Zeynep Sonmez
  // BP7: Zakharova def. Seidel
  'cmmbkq52e0006fbujuinr3t0z': 'cmma2ljob006d8uujonz5inq1', // Anastasia Zakharova
  // BP8: Blinkova def. Galfi
  'cmmbkq58x0007fbujhzyhhkjt': 'cmma2li9c00588uujw43gi0vt', // Anna Blinkova
  // BP9: Rakhimova def. Andreescu
  'cmmbkq5d60008fbuj4ql3dne2': 'cmma2ljph006e8uujjsoqq0t5', // Kamilla Rakhimova
  // BP10: Yastremska def. Zhang
  'cmmbkq5h00009fbuj8ynterzw': 'cmma2libn005a8uujsihatyyj', // Dayana Yastremska
  // BP11: Cirstea def. Maria
  'cmmbkq5lm000afbujw3685qjo': 'cmma2lis4005n8uujupgd4fmu', // Sorana Cirstea
  // BP12: Bouzas Maneiro def. Haddad Maia
  'cmmbkq5pf000bfbuj91aqo2e1': 'cmma2liui005p8uuji5ec1yua', // Jessica Bouzas Maneiro
  // BP13: Gibson def. Ann Li
  'cmmbkq5uo000dfbujns02cnfe': 'cmma2ljqn006f8uuj8836dia1', // Talia Gibson
  // BP14: Putintseva def. Badosa
  'cmmbkq5yj000efbujau4eyc4k': 'cmma2lik6005h8uuj5wbjnyxe', // Yulia Putintseva
  // BP15: Tomljanovic def. Ruse
  'cmmbkq62o000ffbujeww1hl86': 'cmma2ljh700678uujy5tod0rq', // Ajla Tomljanovic
  // BP16: Potapova def. Stakusic
  'cmmbkq665000gfbujdaxyil8w': 'cmma2ljjn00698uuj6y5jq7xe', // Anastasia Potapova
  // BP17: Vekic def. Valentova
  'cmmbkq6ao000hfbujfc9j7i8x': 'cmma2lidz005c8uujpt07q7cm', // Donna Vekic
  // BP18: Volynets def. Sramkova (W:FF — walkover/forfeit)
  'cmmbkq6e6000ifbujhh0ren8s': 'cmma2ligd005e8uujhay70z1z', // Katie Volynets
  // BP19: Bucsa def. Vidmanova
  'cmmbkq6ho000jfbujyyokgyyl': 'cmma2lilz005i8uujs0rlb45y', // Cristina Bucsa
  // BP20: Hunter def. Frech
  'cmmbkq6lf000kfbuj7s43raf0': 'cmma2lju9006i8uujfhzyekyb', // Storm Hunter
  // BP21: Parry def. Venus Williams
  'cmmbkq6q3000lfbujh18izx39': 'cmma2ljve006j8uujwpcznm62', // Diane Parry
  // BP22: Kartal def. Tararudee
  'cmmbkq6u2000mfbujjutey6e8': 'cmma2lj0h005u8uuj53sdzp8i', // Sonay Kartal
  // BP23: Townsend def. Bouzkova
  'cmmbkq6zu000nfbuj1cswfmes': 'cmma2ljxp006l8uuj3hzc6r7n', // Taylor Townsend
  // BP24: Baptiste def. Arango
  'cmmbkq73f000ofbuj0h8y8ggn': 'cmma2liol005k8uujb454capt', // Hailey Baptiste
  // BP25: Sierra def. Stearns
  'cmmbkq77k000pfbujazu11uqm': 'cmma2lj41005x8uujart4toay', // Solana Sierra
  // BP26: Siniakova def. Kenin
  'cmmbkq7br000qfbujupdjji1q': 'cmma2lj5a005y8uuj29rbpf5o', // Katerina Siniakova
  // BP27: Krueger def. Linette
  'cmmbkq7g7000rfbuju68b4by4': 'cmma2lj9400618uujab3h14hd', // Ashlyn Krueger
  // BP28: Siegemund def. Marcinko
  'cmmbkq7k1000sfbujvf73ch6h': 'cmma2ljac00628uuj37mbmn5l', // Laura Siegemund
  // BP29: Bondar def. Jacquemot
  'cmmbkq7ns000tfbuj73wq66ob': 'cmma2ljev00658uujd3rhj7fk', // Anna Bondar
  // BP30: Ruzic def. Brady
  'cmmbkq7rq000ufbujf5qmjb9z': 'cmma2ljg200668uujcpwigmcs', // Antonia Ruzic
  // BP31: Tagger def. Gracheva
  'cmmbkq7xr000vfbujxf6rn21q': 'cmma2lihk005f8uujeeyowb2i', // Lilli Tagger
  // BP32: Day def. Jones
  'cmmbkq81a000wfbuj7w2szs6d': 'cmma2ljz7006m8uuj07bnmjrv', // Kayla Day
};

// WTA walkovers
const wtaWalkovers = {
  // BP18: Volynets def. Sramkova W:FF (walkover/forfeit)
  'cmmbkq6e6000ifbujhh0ren8s': true,
};

async function main() {
  let entered = 0;
  let errors = 0;

  // Fix BP5: Replace Cazaux with Kopriva (Lucky Loser) and enter result
  console.log('=== FIXING BP5: CAZAUX -> KOPRIVA ===');
  const atpTournamentId = 'cmma1wmsw00008uujj5u77alz';
  let kopriva = await db.player.findFirst({
    where: { name: 'Vit Kopriva', tournamentId: atpTournamentId }
  });
  if (!kopriva) {
    kopriva = await db.player.create({
      data: {
        name: 'Vit Kopriva',
        country: 'CZE',
        tournamentId: atpTournamentId,
      }
    });
    console.log('Created player: Vit Kopriva (CZE)');
  }
  // Update BP5 match: replace Cazaux (player2) with Kopriva, set Kopriva as winner
  const bp5MatchId = 'cmmbkqvb60005jaujz429ggyr';
  await db.match.update({
    where: { id: bp5MatchId },
    data: {
      player2Id: kopriva.id,
      winnerId: kopriva.id,
      resultEnteredAt: new Date(),
    }
  });
  console.log('BP5: Kopriva def. Zheng (Cazaux replaced by Lucky Loser)');

  // Enter ATP results
  console.log('\n=== ENTERING ATP R1 RESULTS ===');
  for (const [matchId, winnerId] of Object.entries(atpResults)) {
    try {
      const retiredPlayerId = atpRetirements[matchId] || null;
      await db.match.update({
        where: { id: matchId },
        data: {
          winnerId,
          retiredPlayerId,
          resultEnteredAt: new Date(),
        },
      });
      entered++;
      process.stdout.write('.');
    } catch (err) {
      console.error('\nError entering result for match ' + matchId + ': ' + err.message);
      errors++;
    }
  }
  console.log('\nATP: ' + entered + ' results entered, ' + errors + ' errors');

  // Enter WTA results
  entered = 0;
  errors = 0;
  console.log('\n=== ENTERING WTA R1 RESULTS ===');
  for (const [matchId, winnerId] of Object.entries(wtaResults)) {
    try {
      const isWalkover = wtaWalkovers[matchId] || false;
      await db.match.update({
        where: { id: matchId },
        data: {
          winnerId,
          isWalkover,
          resultEnteredAt: new Date(),
        },
      });
      entered++;
      process.stdout.write('.');
    } catch (err) {
      console.error('\nError entering result for match ' + matchId + ': ' + err.message);
      errors++;
    }
  }
  console.log('\nWTA: ' + entered + ' results entered, ' + errors + ' errors');

  // Verify counts
  const atpRound = await db.round.findFirst({
    where: { tournament: { id: 'cmma1wmsw00008uujj5u77alz' }, roundNumber: 1 }
  });
  const wtaRound = await db.round.findFirst({
    where: { tournament: { id: 'cmma1xsji00088uuju4lwwiv9' }, roundNumber: 1 }
  });

  const atpCompleted = await db.match.count({ where: { roundId: atpRound.id, winnerId: { not: null } } });
  const atpPending = await db.match.count({ where: { roundId: atpRound.id, winnerId: null } });
  const wtaCompleted = await db.match.count({ where: { roundId: wtaRound.id, winnerId: { not: null } } });
  const wtaPending = await db.match.count({ where: { roundId: wtaRound.id, winnerId: null } });

  console.log('\n=== VERIFICATION ===');
  console.log('ATP R1: ' + atpCompleted + ' completed, ' + atpPending + ' pending');
  console.log('WTA R1: ' + wtaCompleted + ' completed, ' + wtaPending + ' pending');

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
