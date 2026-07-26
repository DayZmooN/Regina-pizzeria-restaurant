const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const DEFAULT_ADMIN_EMAIL = "admin@restaurant.local";
const DEFAULT_ADMIN_PASSWORD = "changeme123";

const defaultData = {
  admin: {
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10),
  },
  content: {
    branding: {
      logoUrl: "",
      logoText: {
        fr: "Restaurant Belvédère",
        de: "Restaurant Belvédère",
        it: "Restaurant Belvédère",
        en: "Restaurant Belvédère",
      },
    },
    site: {
      name: {
        fr: "Restaurant Belvédère",
        de: "Restaurant Belvédère",
        it: "Restaurant Belvédère",
        en: "Restaurant Belvédère",
      },
      metaTitle: {
        fr: "Restaurant Belvédère — Cuisine suisse de saison à Fribourg",
        de: "Restaurant Belvédère — Saisonale Schweizer Küche in Freiburg",
        it: "Restaurant Belvédère — Cucina svizzera di stagione a Friburgo",
        en: "Restaurant Belvédère — Seasonal Swiss cuisine in Fribourg",
      },
      metaDesc: {
        fr: "Cuisine suisse de saison, produits locaux, terrasse avec vue à Fribourg. Réservez votre table en ligne.",
        de: "Saisonale Schweizer Küche, lokale Produkte, Terrasse mit Aussicht in Freiburg. Tisch online reservieren.",
        it: "Cucina svizzera di stagione, prodotti locali, terrazza con vista a Friburgo. Prenota il tuo tavolo online.",
        en: "Seasonal Swiss cuisine, local produce, terrace with a view in Fribourg. Book your table online.",
      },
      tagline: {
        fr: "Cuisine suisse de saison, au cœur de Fribourg.",
        de: "Saisonale Schweizer Küche, im Herzen von Freiburg.",
        it: "Cucina svizzera di stagione, nel cuore di Friburgo.",
        en: "Seasonal Swiss cuisine, in the heart of Fribourg.",
      },
    },
    hero: {
      imageUrl: "",
      eyebrow: {
        fr: "Fribourg · Suisse",
        de: "Freiburg · Schweiz",
        it: "Friburgo · Svizzera",
        en: "Fribourg · Switzerland",
      },
      title: {
        fr: "Une table qui suit le rythme des saisons",
        de: "Ein Tisch im Rhythmus der Jahreszeiten",
        it: "Una tavola che segue il ritmo delle stagioni",
        en: "A table that follows the rhythm of the seasons",
      },
      lead: {
        fr: "Produits locaux, cave de vins suisses et vue sur la vieille ville — à quelques pas de la cathédrale.",
        de: "Lokale Produkte, Schweizer Weinkeller und Blick auf die Altstadt — nur wenige Schritte von der Kathedrale entfernt.",
        it: "Prodotti locali, cantina di vini svizzeri e vista sulla città vecchia — a pochi passi dalla cattedrale.",
        en: "Local produce, a Swiss wine cellar and a view of the old town — a few steps from the cathedral.",
      },
      cta1: { fr: "Réserver une table", de: "Tisch reservieren", it: "Prenota un tavolo", en: "Reserve a table" },
      cta2: { fr: "Découvrir la carte", de: "Speisekarte entdecken", it: "Scopri il menu", en: "View the menu" },
    },
    about: {
      title: { fr: "Notre histoire", de: "Unsere Geschichte", it: "La nostra storia", en: "Our story" },
      text: {
        fr: "Ouvert en 2019 dans une ancienne maison de maître, le Belvédère marie la précision de la cuisine suisse à des influences de saison. Le marché du jeudi et les producteurs du canton dictent la carte, pas l'inverse.",
        de: "Das 2019 in einem alten Herrenhaus eröffnete Belvédère verbindet die Präzision der Schweizer Küche mit saisonalen Einflüssen. Der Donnerstagsmarkt und die Produzenten des Kantons bestimmen die Karte — nicht umgekehrt.",
        it: "Aperto nel 2019 in un'antica casa signorile, il Belvédère unisce la precisione della cucina svizzera a influenze di stagione. Il mercato del giovedì e i produttori del cantone dettano il menu, non il contrario.",
        en: "Opened in 2019 in a former manor house, Belvédère blends the precision of Swiss cooking with seasonal influences. The Thursday market and the canton's producers dictate the menu — not the other way around.",
      },
      quote: {
        fr: "« Le meilleur ingrédient reste le temps qu'on lui laisse. »",
        de: "«Die beste Zutat ist die Zeit, die man ihr lässt.»",
        it: "«Il miglior ingrediente resta il tempo che gli si concede.»",
        en: "\"The best ingredient is still the time you give it.\"",
      },
      imageUrl: "",
      founded: "2019",
      seats: { fr: "42 + terrasse 20", de: "42 + Terrasse 20", it: "42 + terrazza 20", en: "42 + 20 terrace" },
      chef: "M. Dupasquier",
    },
    faq: {
      title: { fr: "Questions fréquentes", de: "Häufige Fragen", it: "Domande frequenti", en: "Frequently asked questions" },
      items: [
        {
          id: "faq1",
          q: {
            fr: "Faut-il réserver pour manger au Restaurant Belvédère ?",
            de: "Muss man im Restaurant Belvédère reservieren?",
            it: "È necessario prenotare al Restaurant Belvédère?",
            en: "Do I need to book a table at Restaurant Belvédère?",
          },
          a: {
            fr: "La réservation est conseillée, surtout le week-end et en soirée, mais nous accueillons aussi les personnes de passage selon les places disponibles.",
            de: "Eine Reservierung wird empfohlen, besonders am Wochenende und abends, aber wir empfangen auch Laufkundschaft nach Verfügbarkeit.",
            it: "La prenotazione è consigliata, soprattutto nel weekend e la sera, ma accogliamo anche chi arriva senza prenotazione, in base ai posti disponibili.",
            en: "Booking is recommended, especially in the evening and on weekends, but we also welcome walk-ins depending on availability.",
          },
        },
        {
          id: "faq2",
          q: {
            fr: "Où se trouve le restaurant et comment y accéder ?",
            de: "Wo befindet sich das Restaurant und wie erreicht man es?",
            it: "Dove si trova il ristorante e come raggiungerlo?",
            en: "Where is the restaurant and how do I get there?",
          },
          a: {
            fr: "Nous sommes situés Route du Belvédère 12, à Fribourg, à quelques pas de la vieille ville. Un parking public se trouve à proximité.",
            de: "Wir befinden uns an der Route du Belvédère 12 in Freiburg, nur wenige Schritte von der Altstadt entfernt. In der Nähe gibt es einen öffentlichen Parkplatz.",
            it: "Ci troviamo in Route du Belvédère 12, a Friburgo, a pochi passi dalla città vecchia. Nelle vicinanze si trova un parcheggio pubblico.",
            en: "We're located at Route du Belvédère 12 in Fribourg, a short walk from the old town. Public parking is available nearby.",
          },
        },
      ],
    },
    location: { addr1: "Route du Belvédère 12", addr2: "1700 Fribourg, Suisse", lat: 46.8065, lng: 7.1615 },
    contact: { phone: "+41 26 000 00 00", email: "contact@restaurant-belvedere.ch", instagram: "https://www.instagram.com/" },
  },
  menu: {
    categories: [
      {
        id: "cat1",
        name: { fr: "Entrées", de: "Vorspeisen", it: "Antipasti", en: "Starters" },
        items: [
          {
            id: "item1",
            name: { fr: "Velouté de courge du marché", de: "Kürbiscremesuppe vom Markt", it: "Vellutata di zucca del mercato", en: "Market pumpkin velouté" },
            desc: { fr: "Graines torréfiées, huile de noisette", de: "Geröstete Kerne, Haselnussöl", it: "Semi tostati, olio di nocciola", en: "Toasted seeds, hazelnut oil" },
            price: "16",
            imageUrl: "",
          },
          {
            id: "item2",
            name: { fr: "Truite fumée du lac", de: "Geräucherte Seeforelle", it: "Trota di lago affumicata", en: "Smoked lake trout" },
            desc: { fr: "Crème acidulée, betterave, aneth", de: "Sauerrahm, Randen, Dill", it: "Panna acidula, barbabietola, aneto", en: "Tangy cream, beetroot, dill" },
            price: "19",
            imageUrl: "",
          },
        ],
      },
      {
        id: "cat2",
        name: { fr: "Plats", de: "Hauptgänge", it: "Piatti principali", en: "Mains" },
        items: [
          {
            id: "item3",
            name: { fr: "Joue de bœuf braisée, polenta", de: "Geschmorte Rinderbacke, Polenta", it: "Guancia di manzo brasata, polenta", en: "Braised beef cheek, polenta" },
            desc: { fr: "Jus corsé, légumes racines", de: "Kräftiger Jus, Wurzelgemüse", it: "Fondo di cottura, verdure radice", en: "Rich jus, root vegetables" },
            price: "38",
            imageUrl: "",
          },
        ],
      },
      {
        id: "cat3",
        name: { fr: "Desserts", de: "Desserts", it: "Dessert", en: "Desserts" },
        items: [
          {
            id: "item4",
            name: { fr: "Meringue double crème", de: "Meringue mit Doppelrahm", it: "Meringa con panna doppia", en: "Meringue with double cream" },
            desc: { fr: "Fruits rouges de saison", de: "Saisonale Beeren", it: "Frutti di bosco di stagione", en: "Seasonal red berries" },
            price: "12",
            imageUrl: "",
          },
        ],
      },
    ],
  },
  gallery: [
    { id: "g1", url: "", caption: { fr: "La salle", de: "Der Gastraum", it: "La sala", en: "The dining room" } },
    { id: "g2", url: "", caption: { fr: "La terrasse", de: "Die Terrasse", it: "La terrazza", en: "The terrace" } },
    { id: "g3", url: "", caption: { fr: "En cuisine", de: "In der Küche", it: "In cucina", en: "In the kitchen" } },
  ],
  reviews: {
    title: { fr: "Ils en parlent", de: "Das sagen unsere Gäste", it: "Ne parlano così", en: "What guests are saying" },
    items: [
      {
        id: "r1",
        author: "Sophie M.",
        rating: 5,
        status: "approved",
        text: {
          fr: "Un accueil chaleureux et une cuisine qui respecte vraiment les saisons.",
          de: "Ein herzlicher Empfang und eine Küche, die die Saisons wirklich respektiert.",
          it: "Un'accoglienza calorosa e una cucina che rispetta davvero le stagioni.",
          en: "A warm welcome and cooking that truly respects the seasons.",
        },
      },
    ],
  },
  hours: [
    { day: { fr: "Lundi", de: "Montag", it: "Lunedì", en: "Monday" }, text: "Fermé", closed: true },
    { day: { fr: "Mardi", de: "Dienstag", it: "Martedì", en: "Tuesday" }, text: "11h30 – 22h00", closed: false },
    { day: { fr: "Mercredi", de: "Mittwoch", it: "Mercoledì", en: "Wednesday" }, text: "11h30 – 22h00", closed: false },
    { day: { fr: "Jeudi", de: "Donnerstag", it: "Giovedì", en: "Thursday" }, text: "11h30 – 22h00", closed: false },
    { day: { fr: "Vendredi", de: "Freitag", it: "Venerdì", en: "Friday" }, text: "11h30 – 23h00", closed: false },
    { day: { fr: "Samedi", de: "Samstag", it: "Sabato", en: "Saturday" }, text: "11h30 – 23h00", closed: false },
    { day: { fr: "Dimanche", de: "Sonntag", it: "Domenica", en: "Sunday" }, text: "11h00 – 15h00", closed: false },
  ],
  reservations: [],
};

if (fs.existsSync(DB_PATH)) {
  console.log("data/db.json existe déjà — seed ignoré (supprimez le fichier pour re-générer).");
} else {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2), "utf-8");
  console.log("Base de données initialisée : " + DB_PATH);
  console.log("Compte admin par défaut :");
  console.log("  email    : " + DEFAULT_ADMIN_EMAIL);
  console.log("  password : " + DEFAULT_ADMIN_PASSWORD);
  console.log("⚠️  Changez ce mot de passe dès la première connexion (onglet Admin > Compte).");
}
