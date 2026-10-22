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
// Legs can be adjusted by editing this file or by adding your own bookings (Reservations), which also show on the day cards.
export const ITALY_EXTRA = {
  days: [
    ["Jun 26", "Salerno → Rome by train", ["Salerno", "Rome"], "Disembark in Salerno and take the train to Rome, about two hours on a high-speed service. Check in, then spend the afternoon and evening on foot around the historic centre.", "rail"],
    ["Jun 27", "A full day in Rome", ["Colosseum", "Pantheon", "Trevi Fountain", "Vatican City"], "One day for the highlights: the Colosseum and Forum in the morning, the Pantheon and Trevi Fountain after lunch, and the Vatican if there is time and energy left.", "walk"],
    ["Jun 28", "Fly home", [], "Early train to Fiumicino airport, then Rome to Chicago to Kansas City. Allow plenty of time for the international departure and the connection.", "air"],
  ],
  places: {
    Rome: [41.9028, 12.4964], Colosseum: [41.8902, 12.4922], Pantheon: [41.8986, 12.4769], "Trevi Fountain": [41.9009, 12.4833], "Vatican City": [41.9022, 12.4539],
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
    SR: [[40.6824, 14.7681], [40.7006, 14.7053], [40.7457, 14.6458], [40.7456, 14.4977], [40.7405, 14.4533], [40.7889, 14.3672], [40.8528, 14.2724], [41.0725, 14.3338], [41.1056, 14.2078], [41.4856, 13.8317], [41.6283, 13.3419], [41.7297, 13.0027], [41.9028, 12.4964]],
  },
  airports: { MCI: { name: "Kansas City (MCI)", ll: [39.2976, -94.7139] }, YYZ: { name: "Toronto Pearson (YYZ)", ll: [43.6777, -79.6248] }, NAP: { name: "Naples (NAP)", ll: [40.886, 14.2908] }, FCO: { name: "Rome Fiumicino (FCO)", ll: [41.8003, 12.2389] }, ORD: { name: "Chicago O'Hare (ORD)", ll: [41.9742, -87.9073] } },
  legs: [
    { id: "out", day: 1, tour: true, kind: "Flight", date: "2027-06-17", title: "Kansas City → Toronto → Naples", route: ["MCI", "YYZ", "NAP"], note: "An overnight crossing: you land in Naples on Day 1 (Jun 18). Check the Toronto connection time and that bags are checked through to Naples." },
    { id: "train-out", day: 2, tour: true, line: "NS", kind: "Train", date: "2027-06-19", title: "Naples → Salerno", note: "From Napoli Centrale, high-speed and regional trains take roughly 35 to 60 minutes. A short taxi from Salerno station reaches Marina d'Arechi." },
    { id: "train-rome", day: 9, kind: "Train", date: "2027-06-26", title: "Salerno → Rome", note: "High-speed trains to Roma Termini take about two hours. Book a seat in advance in summer." },
    { id: "home", day: 11, tour: true, kind: "Flight", date: "2027-06-28", title: "Rome → Chicago → Kansas City", route: ["FCO", "ORD", "MCI"], note: "From Roma Termini, the Leonardo Express to Fiumicino takes about 30 minutes. Allow about three hours before an international departure." },
  ],
};
