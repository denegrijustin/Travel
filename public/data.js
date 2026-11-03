// Built-in trip: Italy 2027. Itinerary text, approximate place coordinates and photo credits (Wikimedia Commons).
export const ITALY_RAW=[{id:"italy-2027",name:"Italy 2027",dates:"Jun 18 – Jun 25, 2027",duration:"8 days",destinations:"9 places",final:"Salerno",itinerary:[
["Jun 18","Arrive in Naples",["Naples"],"Arrive in Naples and head to the hotel. If time allows, enjoy a relaxed evening along the lungomare, with an optional visit to Museo Cappella Sansevero and pizza in the historic center."],
["Jun 19","Salerno → Positano",["Salerno","Positano","Laurito Cove"],"Check in at Marina d'Arechi, provision and set sail west. Swim at Laurito Cove if conditions allow, then spend the evening exploring Positano."],
["Jun 20","Positano → Procida",["Procida","Chiaiolella","Marina di Corricella"],"Cruise into the Gulf of Naples toward colorful Procida. Explore on foot, enjoy beach time at Chiaiolella and finish in Marina di Corricella."],
["Jun 21","Procida → Ischia",["Ischia","Castello Aragonese","La Mortella"],"Sail to Ischia for gardens, thermal waters and a relaxed island afternoon. Optional Castello Aragonese, La Mortella or a thermal spa."],
["Jun 22","Ischia → Sorrento",["Sorrento","Marina Grande"],"Cruise toward Sorrento. Swim when conditions allow, then explore the lanes, viewpoints and Vallone dei Mulini."],
["Jun 23","Sorrento → Capri",["Capri","Marina Piccola","Faraglioni","Blue Grotto"],"Arrive at Capri, anchor near Marina Piccola when possible, see the Faraglioni and spend the afternoon ashore. Blue Grotto is optional depending on conditions."],
["Jun 24","Capri → Capo Conca Bay → Amalfi",["Capo Conca Bay","Amalfi"],"Return toward the Amalfi Coast, stop for a swim and snorkel at Capo Conca Bay, then continue to Amalfi for the cathedral piazza and narrow lanes."],
["Jun 25","Amalfi → Salerno",["Amalfi","Salerno"],"Final coastal cruise back to Salerno with time to refuel, settle accounts and enjoy a final marina evening before disembarkation."]
]}];
export const ITALY_GEO={"places":{"Naples":[40.8359,14.2488],"Marina d'Arechi":[40.6427,14.8157],"Salerno":[40.6824,14.7681],"Positano":[40.6287,14.4855],"Laurito Cove":[40.6195,14.519],"Procida":[40.765,14.0239],"Chiaiolella":[40.7498,14.0088],"Marina di Corricella":[40.7616,14.0296],"Ischia":[40.7436,13.9429],"Castello Aragonese":[40.732,13.9652],"La Mortella":[40.7525,13.8727],"Sorrento":[40.6249,14.3748],"Marina Grande":[40.6275,14.3656],"Capri":[40.5488,14.2284],"Marina Piccola":[40.5452,14.2344],"Faraglioni":[40.54,14.2529],"Blue Grotto":[40.5617,14.209],"Capo Conca":[40.6145,14.5744],"Amalfi":[40.6337,14.6026]},"camp":[40.5575,14.318],"route":{"1":["Naples"],"2":["Marina d'Arechi","Laurito Cove","Positano"],"3":["Positano","@s","@camp","Procida","Chiaiolella","Marina di Corricella"],"4":["Marina di Corricella","Ischia","Castello Aragonese"],"5":["Castello Aragonese","Sorrento","Marina Grande"],"6":["Marina Grande","Capri","Marina Piccola","Faraglioni","Blue Grotto"],"7":["Faraglioni","@camp","@s","Capo Conca","Amalfi"],"8":["Amalfi","Salerno"]},"s":[[40.605,14.46],[40.575,14.385]]};
export const ITALY_PHOTOS={"1":{"src":"/img/day-1.jpg","credit":"Richard Nevell · CC BY-SA 4.0","url":"https://commons.wikimedia.org/wiki/File:Napoli_-_Maschio_Angioino_-_202209302342_3.jpg"},"2":{"src":"/img/day-2.jpg","credit":"JeCCo · CC BY 4.0","url":"https://commons.wikimedia.org/wiki/File:Positano_Sunset.JPG"},"3":{"src":"/img/day-3.jpg","credit":"Ekrem Canli · CC BY-SA 4.0","url":"https://commons.wikimedia.org/wiki/File:Corricella_2016%2C_Procida_%282%29.jpg"},"4":{"src":"/img/day-4.jpg","credit":"Ugeorge · CC BY-SA 3.0","url":"https://commons.wikimedia.org/wiki/File:Spiaggia_dei_Pescatori.jpg"},"5":{"src":"/img/day-5.jpg","credit":"Kim Traynor · CC BY-SA 3.0","url":"https://commons.wikimedia.org/wiki/File:View_of_Sorrento.jpg"},"6":{"src":"/img/day-6.jpg","credit":"Sean William · Public domain","url":"https://commons.wikimedia.org/wiki/File:Capri_coastline.jpg"},"7":{"src":"/img/day-7.jpg","credit":"Sudodana2048 · CC BY-SA 3.0","url":"https://commons.wikimedia.org/wiki/File:Amalfi_sea_view_Italy.JPG"},"8":{"src":"/img/day-8.jpg","credit":"Cabalist12 · CC BY-SA 4.0","url":"https://commons.wikimedia.org/wiki/File:Panorama_of_salerno_from_arechi.jpg"}};

// The rest of the journey: Rome after the sailing week, and the flights and trains that bracket the trip.
// Dates assume the charter ends on Saturday Jun 26: train to Rome that morning, a full Sunday there, and a flight home on Monday Jun 28.
// A flight leg lists its flights ({ no, airline, aircraft, cabin, seats }); aircraft and seats show on the booking card, or "to add" when missing.
// Legs can be adjusted by editing this file or by adding your own bookings (Reservations), which also show on the day cards.
// The days before the charter: out to Toronto, the overnight flight, and Rome. Day numbers follow on from these, so the sailing week is Days 4 to 11.
export const ITALY_PRE = [
  ["Jun 15", "Fly to Toronto", ["Toronto"], "Fly Kansas City to Toronto on United UA303 (3:22 PM, landing 9:34 PM), then check in at the Hilton Toronto Airport Hotel & Suites in Mississauga for the night.", "walk"],
  ["Jun 16", "Toronto → Amsterdam", ["Amsterdam"], "Check out by noon, then take KLM KL692 from Toronto Pearson at 4:45 PM: an overnight flight to Amsterdam Schiphol, where you connect straight on to Rome.", "walk"],
  ["Jun 17", "Amsterdam → Rome", ["Rome"], "KLM KL1601 leaves Amsterdam at 7:20 AM for Rome Fiumicino. The arrival time is still to add. A first day in Rome before the train to Naples (no hotel is added yet).", "walk"],
];

export const ITALY_EXTRA = {
  days: [
    ["Jun 26", "Salerno → Rome by train", ["Salerno", "Rome"], "Disembark in Salerno and take the train to Rome, about two hours on a high-speed service. Check in, then spend the afternoon and evening on foot around the historic centre.", "rail"],
    ["Jun 27", "A full day in Rome", ["Colosseum", "Pantheon", "Trevi Fountain", "Vatican City"], "One day for the highlights: the Colosseum and Forum in the morning, the Pantheon and Trevi Fountain after lunch, and the Vatican if there is time and energy left.", "walk"],
    ["Jun 28", "Fly home", [], "Head to Fiumicino airport (Terminal 3) for the 11:05 AM flight to Philadelphia, then connect to Kansas City, landing at 8:03 PM. Allow plenty of time for the international departure and for customs in Philadelphia.", "air"],
  ],
  places: {
    Toronto: [43.7066, -79.599], Amsterdam: [52.3676, 4.9041], Rome: [41.9028, 12.4964], Colosseum: [41.8902, 12.4922], Pantheon: [41.8986, 12.4769], "Trevi Fountain": [41.9009, 12.4833], "Vatican City": [41.9022, 12.4539],
  },
  route: {
    2: ["Marina d'Arechi", "@D2", "Laurito Cove", "Positano"], // round Capo d'Orso and Capo Conca at sea
    6: ["Marina Grande", "@D6", "Capri", "Marina Piccola", "Faraglioni", "Blue Grotto"], // out around Punta del Capo
    8: ["Amalfi", "@D8", "Salerno"],
    9: ["@SR"], 10: ["Colosseum", "Pantheon", "Trevi Fountain", "Vatican City"] },
  // Approximate rail corridors (lat, lon through the main stations) so trains are drawn along the line, not straight across the Apennines.
  lines: {
    D2: [[40.615, 14.72], [40.585, 14.62], [40.59, 14.55]],
    D6: [[40.642, 14.34], [40.628, 14.3]],
    D8: [[40.59, 14.6], [40.61, 14.7], [40.64, 14.76]],
    NS: [[40.8359, 14.2488], [40.8528, 14.2724], [40.7889, 14.3672], [40.7405, 14.4533], [40.7456, 14.4977], [40.7457, 14.6458], [40.7006, 14.7053], [40.6824, 14.7681]],
    RN: [[41.9028, 12.4964], [41.7297, 13.0027], [41.6283, 13.3419], [41.4856, 13.8317], [41.1056, 14.2078], [41.0725, 14.3338], [40.8528, 14.2724], [40.8359, 14.2488]],
    SR: [[40.6824, 14.7681], [40.7006, 14.7053], [40.7457, 14.6458], [40.7456, 14.4977], [40.7405, 14.4533], [40.7889, 14.3672], [40.8528, 14.2724], [41.0725, 14.3338], [41.1056, 14.2078], [41.4856, 13.8317], [41.6283, 13.3419], [41.7297, 13.0027], [41.9028, 12.4964]],
  },
  airports: { MCI: { name: "Kansas City (MCI)", ll: [39.2976, -94.7139] }, YYZ: { name: "Toronto Pearson (YYZ)", ll: [43.6777, -79.6248] }, NAP: { name: "Naples (NAP)", ll: [40.886, 14.2908] }, FCO: { name: "Rome Fiumicino (FCO)", ll: [41.8003, 12.2389] }, PHL: { name: "Philadelphia (PHL)", ll: [39.8744, -75.2424] }, AMS: { name: "Amsterdam Schiphol (AMS)", ll: [52.3105, 4.7683] } },
  legs: [
    { id: "out-kc", day: 1, tour: true, kind: "Flight", date: "2027-06-15", title: "Kansas City → Toronto", route: ["MCI", "YYZ"], airlines: ["united"], flights: [{ no: "UA303", airline: "United" }], note: "Tue Jun 15. United UA303, Kansas City (MCI) 3:22 PM → Toronto Pearson (YYZ) 9:34 PM." },
    { id: "toronto-hotel", day: 1, kind: "Hotel", date: "2027-06-15", title: "Hilton Toronto Airport Hotel & Suites", note: "Check in Tue Jun 15 from 3:00 PM, check out Wed Jun 16 by 12:00 PM (1 night). 5875 Airport Road, Mississauga, ON L4V 1N1. +1 905 677 9900." },
    { id: "out-ams", day: 2, tour: true, kind: "Flight", date: "2027-06-16", title: "Toronto → Amsterdam", route: ["YYZ", "AMS"], airlines: ["klm"], flights: [{ no: "KL692", airline: "KLM", seats: "12H, 12K" }], note: "Wed Jun 16. KLM KL692, Toronto Pearson (YYZ) 4:45 PM → Amsterdam Schiphol (AMS). An overnight flight." },
    { id: "out-fco", day: 3, tour: true, kind: "Flight", date: "2027-06-17", title: "Amsterdam → Rome", route: ["AMS", "FCO"], airlines: ["klm"], flights: [{ no: "KL1601", airline: "KLM", seats: "6E, 6F" }], note: "Thu Jun 17. KLM KL1601, Amsterdam Schiphol (AMS) 7:20 AM → Rome Fiumicino (FCO)." },
    { id: "rome-naples", day: 4, tour: true, line: "RN", kind: "Train", date: "2027-06-18", title: "Rome → Naples", note: "Not booked yet: a placeholder for getting from Rome to Naples on the morning of Jun 18. High-speed trains from Roma Termini to Napoli Centrale take about 70 minutes; book a seat in advance in summer." },
    { id: "train-out", day: 5, tour: true, line: "NS", kind: "Train", date: "2027-06-19", title: "Naples → Salerno", note: "From Napoli Centrale, high-speed and regional trains take roughly 35 to 60 minutes. A short taxi from Salerno station reaches Marina d'Arechi." },
    { id: "train-rome", day: 12, kind: "Train", date: "2027-06-26", title: "Salerno → Rome", note: "High-speed trains to Roma Termini take about two hours. Book a seat in advance in summer." },
    { id: "home", day: 14, tour: true, kind: "Flight", date: "2027-06-28", title: "Rome → Philadelphia → Kansas City", route: ["FCO", "PHL", "MCI"], airlines: ["iberia", "american"], flights: [{ no: "IB4659", airline: "Iberia (operated by American)", aircraft: "Boeing 787-9", cabin: "Premium Economy" }, { no: "AA2903", airline: "American" }], note: "Mon Jun 28. Iberia IB4659 (operated by American), Rome FCO Terminal 3 11:05 AM → Philadelphia 2:45 PM, 9 h 40 min, Boeing 787-9, Premium Economy. Then American AA2903, Philadelphia 5:51 PM → Kansas City 8:03 PM, 3 h 12 min. From Roma Termini, the Leonardo Express to Fiumicino takes about 30 minutes; allow about three hours before an international departure." },
  ],
};
