// Place guides for the Italy 2027 stops: a short history, what to see, practical notes and one odd fact each.
// Written from general knowledge and checked against Wikipedia (linked from every guide). Opening hours, prices and sea conditions
// change, so the notes say what to check rather than promise anything. `wiki` is the Wikipedia article used for the live "About" text and photo.
export const PLACES = {
  Naples: {
    area: "Gulf of Naples · Campania", wiki: "Naples",
    tagline: "A loud, layered, endlessly alive port city under Vesuvius.",
    history: [
      "Greek settlers from Cumae founded Neapolis, the \"new city\", around the 6th century BC beside an older settlement called Parthenope. It became a Roman city and kept its Greek language and culture for centuries.",
      "Naples was a duchy, then the capital of a kingdom ruled in turn by the Normans, Angevins, Aragonese, Spanish viceroys and the Bourbons, until Italian unification in 1861. Each left churches, palaces and fortresses, which is why the historic centre, a UNESCO World Heritage Site since 1995, feels like several cities stacked together.",
    ],
    see: ["Spaccanapoli, the straight street that cuts the old centre in two", "Cappella Sansevero, a baroque chapel with Giuseppe Sanmartino's Veiled Christ (1753)", "Castel dell'Ovo, on the islet of Megaride, and the seafront promenade at Lungomare Caracciolo", "The National Archaeological Museum, home to much of what was found at Pompeii and Herculaneum", "Pizza in the historic centre: modern pizza was born here"],
    tips: ["Book Cappella Sansevero ahead; timed tickets sell out.", "Classic pizzerias in the old centre queue at dinner. Go early or at an off hour.", "Keep phones and bags close in crowded streets and on buses."],
    fact: "A much-told story says the Margherita pizza, with tomato, mozzarella and basil in the colours of the flag, was made in 1889 for Queen Margherita. Historians doubt the details, but the pizza is real.",
  },
  Salerno: {
    area: "Gulf of Salerno · Campania", wiki: "Salerno",
    tagline: "The working port and gateway to the Amalfi Coast, with a medieval heart.",
    history: [
      "The Romans founded a colony at Salernum in 194 BC. In the 9th century Salerno became the seat of a Lombard principality, and Arechis II strengthened the hilltop castle that still overlooks the city.",
      "In the Middle Ages Salerno was home to the Schola Medica Salernitana, often described as the first medical school in Europe. The Normans made it their capital under Robert Guiscard, who began the cathedral in 1076; Pope Gregory VII, who died in exile in Salerno in 1085, is buried there. In September 1943 the Allied landings of Operation Avalanche took place on the beaches south of the city.",
    ],
    see: ["Duomo di San Matteo, with its atrium, bronze doors and crypt", "Castello di Arechi, high above the city, for the view over the whole gulf", "The Lungomare Trieste, a palm-lined seafront promenade", "The old town's Via dei Mercanti", "In winter, the Luci d'Artista light installations"],
    tips: ["Marina d'Arechi, the modern marina where the boat leaves from, is on the city's south-eastern waterfront. Allow time for provisioning and the check-in paperwork on the first day.", "Fast ferries run from Salerno along the Amalfi Coast, handy for a day without the boat."],
    fact: "The Schola Medica Salernitana's verse health guide, the Regimen Sanitatis Salernitanum, was copied and translated across Europe for centuries.",
  },
  Positano: {
    area: "Amalfi Coast · Campania", wiki: "Positano",
    tagline: "Pastel houses stacked in a vertical village above a pebble beach.",
    history: [
      "Legend credits Poseidon with founding the town. What is certain is that a Roman villa stood here: it was buried by the eruption of Vesuvius in AD 79, and frescoed rooms have been found beneath the church of Santa Maria Assunta.",
      "In the Middle Ages Positano belonged to the Maritime Republic of Amalfi and traded across the Mediterranean. Poverty and emigration emptied it in the 19th and early 20th centuries. After the Second World War artists and writers rediscovered it, and John Steinbeck's 1953 magazine essay about Positano helped make it famous.",
    ],
    see: ["Santa Maria Assunta, with its majolica-tiled dome", "Spiaggia Grande and the walk along the beach to Fornillo", "The stepped lanes and boutiques down to the sea", "The Sentiero degli Dei (Path of the Gods), a famous hike on the hills above, if you have a free morning"],
    tips: ["The town is built on steep stairs. Pack light for the walk ashore.", "Space to anchor off the beach is limited and the bay can be busy in June. Check the plan for the night with the skipper.", "Sunset from the water, with the town lit up, is the classic view."],
    fact: "One legend says Poseidon founded Positano for the nymph Pasitea, whom he loved, which is where the name is said to come from.",
  },
  "Laurito Cove": {
    area: "Positano coast · Campania", wiki: "Positano",
    tagline: "A small pebble cove on the coast west of Positano, best reached from the sea.",
    history: [
      "Laurito is a hamlet and beach within Positano's coastline, one of several small coves along this stretch that were once reachable only by boat or by steep mule tracks. Fishing boats pulled up on the stones, and the cliffs above were farmed in terraces.",
      "Like the rest of the coast, it belonged for centuries to the orbit of the Maritime Republic of Amalfi, and later to Naples. Watchtowers built to warn of raiders still stand on headlands nearby.",
    ],
    see: ["A swim in clear water off the pebbles", "The cliffs and terraces above the cove, seen from the water", "A beach restaurant ashore, where lunch is often the draw"],
    tips: ["A swim stop depends on wind and swell. Have a second cove in mind if the water is rough.", "Check the anchoring options and depth with the skipper before you go in.", "Bring water shoes: the beach is pebbles."],
    fact: "Many coves on this stretch are easier to reach from the sea than from land, which is why a boat is the classic way to visit them.",
  },
  Procida: {
    area: "Phlegraean Islands · Gulf of Naples", wiki: "Procida",
    tagline: "The smallest, most lived-in of the Gulf's islands, in sherbet colours.",
    history: [
      "Procida is volcanic, formed by the same Phlegraean Fields activity that shaped the coast near Naples. Its crater edges are still visible in the shape of its bays. It was settled in antiquity and later fortified against pirate raids.",
      "The island's walled hilltop village, Terra Murata, grew around a fortress and the Abbey of San Michele Arcangelo. For centuries it was the home of fishermen and sea captains, and its shipbuilding and lemon groves shaped island life. In 2022 Procida was Italy's Capital of Culture.",
    ],
    see: ["Terra Murata, the old fortified village, and the abbey", "Marina di Corricella's painted houses stepping down to the harbour", "Walking the lanes between the island's lemon gardens", "Beaches at Chiaiolella and the Lido"],
    tips: ["The island is small enough to walk. The streets are narrow, so leave bigger bags on the boat.", "Day-trippers arrive by ferry in the late morning. Mornings and evenings are the quiet times."],
    fact: "Procida appears in the film Il Postino (1994), and the Corricella waterfront is the setting people remember. It has also been used in other films.",
  },
  Chiaiolella: {
    area: "Procida · Gulf of Naples", wiki: "Procida",
    tagline: "A sheltered harbour in a drowned volcanic crater, with a nature islet beside it.",
    history: [
      "The harbour at Chiaiolella sits in the rim of an old volcanic crater, which is why the water is so sheltered. It was a quiet fishing hamlet that later grew a marina and a lido.",
      "Just offshore is the islet of Vivara, another crater remnant. Archaeologists have found remains from the Bronze Age, including pottery linked to Mycenaean traders, and it is now a protected nature reserve reached by a footbridge from Procida.",
    ],
    see: ["A walk over the bridge to Vivara (check access and opening before you go)", "The crescent beach at the Lido", "Seafood on the harbourfront"],
    tips: ["Access to the Vivara reserve is controlled. Check whether visits need booking.", "In the evening the harbour is calm and good for a quiet dinner."],
    fact: "Vivara's crescent shape is half of an old volcanic crater, with the other half taken by the sea.",
  },
  "Marina di Corricella": {
    area: "Procida · Gulf of Naples", wiki: "Procida",
    tagline: "The postcard harbour: tiered houses, fishing boats and waterfront restaurants.",
    history: [
      "Corricella is the oldest fishing village on Procida, dating back several centuries. Its houses are built in tiers, each with an arched ground floor once used to store nets and boats, and above it a family home with a terrace.",
      "The bright colours are traditionally said to have helped fishermen pick out their own house from the water. The harbour is still home to working boats.",
    ],
    see: ["The waterfront and the steps behind it", "The viewpoint above the village, up the stairs", "Fresh fish at the harbourside restaurants"],
    tips: ["Berths and anchoring spots in the small harbour fill up, so arrive early or ask the skipper about the plan.", "The lanes above the harbour are steep. Go up for the view, then come down for dinner."],
    fact: "Many of the houses have a stepped outdoor staircase and a rounded arch on the ground floor, a design that is common across the Gulf of Naples islands.",
  },
  Ischia: {
    area: "Gulf of Naples · Campania", wiki: "Ischia",
    tagline: "The largest island in the Gulf, known for thermal springs and green hills.",
    history: [
      "Greek settlers from Euboea founded a trading colony here in the 8th century BC, called Pithekoussai, one of the earliest Greek settlements in the western Mediterranean. A cup found at Lacco Ameno, inscribed with verses in an early Greek alphabet, is among the oldest known examples of Greek writing.",
      "The island is volcanic, with Mount Epomeo at its centre, and its hot springs have drawn visitors since Roman times. In 1883 an earthquake devastated Casamicciola. The modern harbour at Ischia Porto was a crater lake until the Bourbon king opened a channel to the sea in the 1850s.",
    ],
    see: ["Thermal parks and spas, a classic island afternoon", "Mount Epomeo, the island's high point, for the view", "Ischia Ponte and the causeway to the Castello Aragonese", "The village of Sant'Angelo and the town of Forio"],
    tips: ["Thermal parks differ a lot. Check opening hours and booking before you go.", "Ferries and buses make it easy to tour the island without the boat."],
    fact: "Near the summit of Mount Epomeo, 789 metres up, a small hermit's church is cut into the soft volcanic rock.",
  },
  "Castello Aragonese": {
    area: "Ischia Ponte · Ischia", wiki: "Aragonese Castle",
    tagline: "A fortress on a rock, joined to the island by a long stone causeway.",
    history: [
      "The rock has been fortified since ancient times: tradition links the first defences to Hiero I of Syracuse around 474 BC. The present castle takes its name from Alfonso V of Aragon, who rebuilt it in 1441 and linked it to Ischia by the causeway.",
      "For centuries the rock held a small town, with houses, churches and a convent for the Poor Clares, which served as a refuge from pirate raids. The poet Vittoria Colonna lived here in the 16th century. Later it was used as a prison and then lay abandoned for years before being restored.",
    ],
    see: ["The causeway and the climb through the old fortress", "Views from the top across the water to Procida and the mainland", "The terraces, gardens and ruined churches", "A lift runs part of the way up, which helps in the heat"],
    tips: ["Visit early or late. The stone paths are in full sun at midday.", "Wear shoes with grip. The paths are uneven."],
    fact: "At the height of its use the rock was home to around two thousand people, with its own churches and a convent.",
  },
  "La Mortella": {
    area: "Forio · Ischia", wiki: "La Mortella",
    tagline: "A lush garden of waterfalls and rare plants made by a composer's wife.",
    history: [
      "La Mortella was created from a rocky hillside by Susana Walton, the Argentine-born wife of the British composer Sir William Walton, who made his home on Ischia. The garden's first layout was designed by the landscape architect Russell Page.",
      "It grew into a collection of subtropical and Mediterranean plants, pools and water features, and today it is also a place for concerts and music events. The name comes from the Italian word for myrtle, which grows wild in the area.",
    ],
    see: ["The garden's water features, ponds and giant water lilies", "The views over the bay from the upper terraces", "A concert, if one is on during your visit"],
    tips: ["Opening days are limited. Check before you plan the day around it.", "It is on the west of the island, away from the harbour. Allow time for the transfer."],
    fact: "The garden's name, La Mortella, means \"the myrtle\" in Italian. Myrtle grows wild on the slopes.",
  },
  Sorrento: {
    area: "Sorrentine Peninsula · Campania", wiki: "Sorrento",
    tagline: "A cliff-top resort town with lemon groves and a view across the bay to Vesuvius.",
    history: [
      "The ancient Surrentum was a Roman resort town, and wealthy Romans built villas along the coast. In the Middle Ages Sorrento was an independent duchy for a time and a base against sea raiders. The poet Torquato Tasso was born here in 1544.",
      "In the 19th century northern European travellers on the Grand Tour made Sorrento a stop, and the town developed its hotels and its famous crafts: inlaid wood, embroidery and lemon products such as limoncello.",
    ],
    see: ["Piazza Tasso and the old town's lanes", "The Villa Comunale gardens, with a view over the bay", "The Vallone dei Mulini, a ravine with the ruins of an old mill", "The cloister of San Francesco", "Inlaid wood workshops and limoncello shops"],
    tips: ["Sorrento is the ferry hub for Capri, Ischia and the Amalfi Coast, which makes it a good base for a day without the boat.", "The town sits on a high cliff. Marina Piccola and Marina Grande are reached by steps or a road."],
    fact: "The Sorrento lemon, a large, thick-skinned variety, is grown in terraced groves under protective nets and gives limoncello its flavour.",
  },
  "Marina Grande": {
    area: "Sorrento · Campania", wiki: "Sorrento",
    tagline: "A former fishing village on the western edge of Sorrento, now known for seafood.",
    history: [
      "Marina Grande was the fishing quarter of Sorrento, with fishermen's houses packed along the shore beneath the cliff. Boats were hauled up on the beach and nets mended in the lanes.",
      "It is still a working harbour, though many of the old houses now hold restaurants.",
    ],
    see: ["Walking the lanes behind the shore", "Seafood at the waterfront restaurants", "Sunset over the bay from the harbour wall"],
    tips: ["It is a good place to eat in the evening. Book if you have a group.", "A steep road and steps connect it to the upper town."],
  },
  Capri: {
    area: "Gulf of Naples · Campania", wiki: "Capri",
    tagline: "A limestone island of cliffs, villas and an old, glamorous reputation.",
    history: [
      "Greeks and later Romans settled Capri. Emperor Augustus took the island for himself around 29 BC, and his successor Tiberius moved here in AD 27 and ruled the empire from it for his last years. The ruins of the Villa Jovis, one of the villas Tiberius built, still stand on the eastern cliffs.",
      "From the 19th century Capri drew artists, writers and travellers, and its fame grew with the discovery of the Blue Grotto. The Swedish physician Axel Munthe built the Villa San Michele in Anacapri, and the island has stayed a retreat for the well known ever since.",
    ],
    see: ["The Piazzetta in Capri town and the lanes around it", "The Gardens of Augustus and the zigzag Via Krupp below", "Villa Jovis, Tiberius's ruined villa", "A chairlift up Monte Solaro from Anacapri", "Villa San Michele and its garden", "A boat trip around the island"],
    tips: ["The island is crowded in midday summer. Mornings, evenings and trips by water are calmer.", "A funicular links Marina Grande with the town. Buses and taxis cover the rest."],
    fact: "A famous story says Augustus traded the larger island of Ischia to Naples to get Capri.",
  },
  "Marina Piccola": {
    area: "South coast of Capri · Campania", wiki: "Capri",
    tagline: "The small bathing harbour on Capri's south side, facing the sea stacks.",
    history: [
      "Marina Piccola sits on the south side of Capri, in the lee of the island away from the main port. It has long been the place where people swim and sunbathe, with small beach clubs and a boatyard.",
      "A rock just offshore, the Scoglio delle Sirene, is tied to the Greek myth of the sirens who lured sailors. Homer's Odyssey is often read as set in these waters, though that link is tradition rather than proof.",
    ],
    see: ["Swimming from the rocks and small beaches", "The view of the Faraglioni from the Via Krupp above", "Lunch at one of the beach restaurants"],
    tips: ["Anchoring depends on wind, so ask the skipper whether the south side is calm that day.", "A road with steep bends climbs to the town. Buses and taxis run it."],
    fact: "The stretch of coast here is full of the legends of the sirens, and several rocks and caves on this side of Capri are linked with them.",
  },
  Faraglioni: {
    area: "East coast of Capri · Campania", wiki: "Faraglioni",
    tagline: "Three limestone sea stacks that have become Capri's emblem.",
    history: [
      "The Faraglioni are three towers of limestone that stand just off the south-east tip of Capri, split from the island by the sea over a very long time. The first is joined to the shore, the middle one has a natural arch, and the third stands furthest out.",
      "The outermost stack is home to a blue-tinged subspecies of wall lizard, found nowhere else. The stacks were long a navigation mark for sailors and a subject for painters and photographers.",
    ],
    see: ["Seeing the three stacks from the water", "Passing through the arch of the middle stack in a small boat, conditions allowing", "Swimming in the clear water nearby"],
    tips: ["Whether a boat can pass through the arch depends on the sea state and rules in force. Ask the skipper.", "Late afternoon light gives the stacks their warmest colour."],
    fact: "The blue wall lizard of the outermost stack lives nowhere else in the world.",
  },
  "Blue Grotto": {
    area: "North coast of Capri · Campania", wiki: "Blue Grotto (Capri)",
    tagline: "A sea cave lit from below, where the water glows an electric blue.",
    history: [
      "The Grotta Azzurra is a sea cave about 60 metres long, entered through a low opening only a metre or so high. Sunlight comes in through a larger opening under the water and lights the cave from below, which gives the water its blue glow.",
      "The Romans knew it and used it, and Emperor Tiberius is said to have used it as a bathing place. It was largely forgotten until 1826, when the German writers August Kopisch and Ernst Fries swam in and made it famous again.",
    ],
    see: ["The glow of the water inside the cave, seen from a small rowing boat", "The crossing along the coast from Marina Grande", "The boatmen's songs, a tradition on the short trip inside"],
    tips: ["Visitors go in by small rowing boat and lie back to pass the entrance. The cave closes when the sea is rough, and the visit is short.", "Waiting times can be long at midday. Check the access rules, tickets and whether the cave is open on the day."],
    fact: "The cave's entrance is so low that boats can only enter when the sea is calm, and passengers must lie flat to pass under the rock.",
  },
  "Capo Conca Bay": {
    area: "Conca dei Marini · Amalfi Coast", wiki: "Conca dei Marini",
    tagline: "A clear-water bay below the cliffs of Conca dei Marini, good for a swim and snorkel.",
    history: [
      "Conca dei Marini is a small village on the Amalfi Coast, once one of the maritime towns of the Republic of Amalfi, known for its sailors and shipbuilders. A watchtower on the headland, Capo di Conca, is one of the coastal towers built to watch for raiders.",
      "Nearby is the Emerald Grotto, a sea cave discovered in 1932 whose water glows green. The village is also tied to the sfogliatella Santa Rosa, a pastry said to have been invented by nuns in a local convent.",
    ],
    see: ["Swimming and snorkelling in the clear water off the headland", "The tower on Capo di Conca and the cliffs above", "The Emerald Grotto, a short way along the coast", "The village's lemon terraces"],
    tips: ["The swim stop depends on swell and wind. Have a backup bay in mind.", "Bring a mask and snorkel. The water here is good for it on calm days."],
    fact: "The Emerald Grotto, near here, was discovered in 1932 by a local fisherman, and a nativity scene stands underwater inside it.",
  },
  Amalfi: {
    area: "Amalfi Coast · Campania", wiki: "Amalfi",
    tagline: "Once a sea power that rivalled Venice and Genoa, now a postcard town with a great cathedral.",
    history: [
      "Amalfi became an independent maritime republic in the 9th century and grew rich on trade with the Byzantine and Arab worlds. For a few centuries it was one of Italy's four great maritime republics, alongside Pisa, Genoa and Venice, and its sea laws, the Tabula de Amalpha, were respected around the Mediterranean.",
      "A storm and tidal wave in 1343 destroyed much of the lower town, and the Pisans and Normans had already weakened it. It sank into quiet fishing and paper-making, and only in the 19th and 20th centuries did travellers rediscover it. The Amalfi Coast became a UNESCO World Heritage Site in 1997.",
    ],
    see: ["The Duomo di Sant'Andrea, with its striped façade, bronze doors and the Cloister of Paradise", "Piazza Duomo, the town's stage", "The Museo della Carta, a paper museum in an old mill, recalling Amalfi's paper-making", "The Valle dei Mulini, a walk through old mill ruins", "A short walk or boat hop to Atrani next door"],
    tips: ["Cathedral entry has a dress code: cover shoulders and knees.", "The town is crowded in the middle of the day when coaches arrive. Early morning and evening are far calmer.", "Amalfi has the sea access, so it is a natural stop for provisioning and a restaurant dinner."],
    fact: "The Amalfi tradition of making paper from rags goes back to the 12th century, and handmade paper is still sold here.",
  },
  Rome: {
    area: "Lazio", wiki: "Rome",
    tagline: "The Eternal City, where almost every street corner is a few thousand years deep.",
    history: [
      "According to legend Romulus founded Rome in 753 BC on the Palatine Hill. From a small city on the Tiber it grew into the centre of a republic and then an empire that, at its height, ruled the whole Mediterranean.",
      "After the empire in the West fell in the 5th century, Rome shrank, but the popes kept it a spiritual capital, and Renaissance and baroque patrons rebuilt it with churches, fountains and piazzas. It became the capital of unified Italy in 1871.",
    ],
    see: ["The Colosseum, the Roman Forum and the Palatine Hill", "The Pantheon and the piazzas around it", "Trevi Fountain, best early in the morning", "St Peter's Basilica and the Vatican Museums", "A walk through Trastevere in the evening"],
    tips: ["With a day and a half, group sights by area on foot and book the Colosseum and Vatican entries ahead.", "Churches and the Vatican require covered shoulders and knees.", "Watch for pickpockets around Termini, the Colosseum and on crowded buses.", "Roma Termini is the main train station; the Leonardo Express runs from there to Fiumicino airport in about 30 minutes."],
    fact: "Rome has more fountains and obelisks than almost any other city; the water of its ancient aqueducts still feeds many of them.",
  },
  Colosseum: {
    area: "Rome · Lazio", wiki: "Colosseum",
    tagline: "The largest amphitheatre ever built, still standing after nearly two thousand years.",
    history: [
      "Emperor Vespasian began the Flavian Amphitheatre around AD 70, on the site of Nero's lake garden, and his son Titus opened it in AD 80 with games that lasted 100 days.",
      "It held tens of thousands of spectators for gladiator fights, animal hunts and spectacles. Earthquakes and centuries of stone-robbing damaged it, and it is now a symbol of the city.",
    ],
    see: ["The arena floor and the underground passages, on special tickets", "The Arch of Constantine next door", "The Roman Forum and Palatine Hill on the same ticket"],
    tips: ["Book timed entry in advance in summer.", "Go first thing in the morning or late in the afternoon to avoid heat and queues."],
    fact: "The name probably comes from a colossal statue of Nero that once stood nearby, not from the building's size.",
  },
  Pantheon: {
    area: "Rome · Lazio", wiki: "Pantheon, Rome",
    tagline: "A temple to all the gods, topped by the world's largest unreinforced concrete dome.",
    history: [
      "Agrippa built the first Pantheon around 27 BC. The present building was completed under Hadrian in about AD 126, and it became a Christian church in AD 609.",
      "Its dome, with a round opening called the oculus, stayed the largest in the world for more than a thousand years. Raphael and Italian kings are buried inside.",
    ],
    see: ["The oculus and the pool of light it casts", "The tomb of Raphael", "Piazza della Rotonda outside"],
    tips: ["Entry now needs a ticket or reservation; check the current rules.", "It remains a church, so dress modestly and keep quiet."],
    fact: "Rain falls through the oculus, and small drains in the floor carry it away.",
  },
  "Trevi Fountain": {
    area: "Rome · Lazio", wiki: "Trevi Fountain",
    tagline: "The baroque fountain where visitors toss coins over their shoulder.",
    history: [
      "The fountain marks the end of the Aqua Virgo aqueduct, which brought water to Rome from about 19 BC. Nicola Salvi's design was finished in 1762.",
    ],
    see: ["The central figure of Oceanus on a shell chariot", "The sculpted sea horses, one calm and one wild"],
    tips: ["It is very crowded in the afternoon and evening; early morning is best.", "Throwing a coin is a tradition; local rules about the fountain change, so follow the signs."],
    fact: "Thousands of euros in coins are collected from the fountain and given to charity.",
  },
  "Vatican City": {
    area: "Rome", wiki: "Vatican City",
    tagline: "The world's smallest country, home to St Peter's and the Sistine Chapel.",
    history: [
      "The Vatican sits where tradition places Saint Peter's tomb. Constantine built a basilica here in the 4th century, replaced by the present St Peter's, finished in 1626.",
      "The Lateran Treaty of 1929 made Vatican City an independent state, about 44 hectares in size.",
    ],
    see: ["St Peter's Basilica and the climb up the dome", "The Vatican Museums and Michelangelo's Sistine Chapel ceiling", "St Peter's Square"],
    tips: ["Book Vatican Museums tickets well ahead; lines are long.", "Strict dress code: covered shoulders and knees.", "The museums close on Sundays except the last Sunday of the month."],
    fact: "The Swiss Guard, who protect the pope, have served since 1506.",
  },
};

export const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const placeBySlug = (slug) => Object.entries(PLACES).map(([name, p]) => ({ name, ...p })).find((p) => slugify(p.name) === slug);
