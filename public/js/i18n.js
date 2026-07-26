const LANGS = ["fr", "de", "it", "en"];
const LANG_LABELS = { fr: "FR", de: "DE", it: "IT", en: "EN" };

const UI = {
  fr: {
    nav: ["À propos", "La carte", "Ambiance", "Horaires & Accès"], reserve: "Réserver", reserveTitle: "Réserver une table", scroll: "Découvrir",
    lblFounded: "Ouverture", lblSeats: "Places assises", lblChef: "Chef de cuisine", lblStyle: "Style",
    menuNote: "Prix en francs suisses (CHF), TVA comprise. Carte des allergènes sur demande.",
    form: { name: "Nom", phone: "Téléphone", date: "Date", time: "Heure", guests: "Nombre de personnes", msg: "Message (optionnel)", submit: "Envoyer la demande" },
    footNav: "Navigation", footContact: "Contact", admin: "Gestion du site",
    closed: "Fermé", itinerary: "Itinéraire", call: "Appeler",
    resNote: "Votre demande est envoyée directement au restaurant. Nous confirmons chaque réservation par téléphone ou e-mail sous 24h.",
    resConfirm: "Merci ! Votre demande de réservation a bien été envoyée.",
    resError: "Une erreur est survenue. Merci de réessayer ou de nous appeler directement.",
  },
  de: {
    nav: ["Über uns", "Speisekarte", "Ambiente", "Öffnungszeiten"], reserve: "Reservieren", reserveTitle: "Tisch reservieren", scroll: "Entdecken",
    lblFounded: "Eröffnung", lblSeats: "Sitzplätze", lblChef: "Küchenchef", lblStyle: "Stil",
    menuNote: "Preise in Schweizer Franken (CHF), inkl. MwSt. Allergenkarte auf Anfrage.",
    form: { name: "Name", phone: "Telefon", date: "Datum", time: "Uhrzeit", guests: "Anzahl Personen", msg: "Nachricht (optional)", submit: "Anfrage senden" },
    footNav: "Navigation", footContact: "Kontakt", admin: "Website verwalten",
    closed: "Geschlossen", itinerary: "Anfahrt", call: "Anrufen",
    resNote: "Ihre Anfrage wird direkt an das Restaurant gesendet. Wir bestätigen jede Reservierung telefonisch oder per E-Mail innerhalb von 24 Stunden.",
    resConfirm: "Danke! Ihre Reservierungsanfrage wurde erfolgreich gesendet.",
    resError: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder rufen Sie uns direkt an.",
  },
  it: {
    nav: ["Chi siamo", "Il menu", "Atmosfera", "Orari & Accesso"], reserve: "Prenotare", reserveTitle: "Prenota un tavolo", scroll: "Scopri di più",
    lblFounded: "Apertura", lblSeats: "Posti a sedere", lblChef: "Chef di cucina", lblStyle: "Stile",
    menuNote: "Prezzi in franchi svizzeri (CHF), IVA inclusa. Carta degli allergeni su richiesta.",
    form: { name: "Nome", phone: "Telefono", date: "Data", time: "Ora", guests: "Numero di persone", msg: "Messaggio (facoltativo)", submit: "Invia richiesta" },
    footNav: "Navigazione", footContact: "Contatto", admin: "Gestione del sito",
    closed: "Chiuso", itinerary: "Itinerario", call: "Chiama",
    resNote: "La tua richiesta viene inviata direttamente al ristorante. Confermiamo ogni prenotazione per telefono o e-mail entro 24 ore.",
    resConfirm: "Grazie! La tua richiesta di prenotazione è stata inviata con successo.",
    resError: "Si è verificato un errore. Riprova o chiamaci direttamente.",
  },
  en: {
    nav: ["About", "Menu", "Atmosphere", "Hours & Location"], reserve: "Reserve a table", reserveTitle: "Reserve a table", scroll: "Discover",
    lblFounded: "Opened", lblSeats: "Seating", lblChef: "Head chef", lblStyle: "Style",
    menuNote: "Prices in Swiss francs (CHF), VAT included. Allergen list on request.",
    form: { name: "Name", phone: "Phone", date: "Date", time: "Time", guests: "Guests", msg: "Message (optional)", submit: "Send request" },
    footNav: "Navigation", footContact: "Contact", admin: "Manage site",
    closed: "Closed", itinerary: "Directions", call: "Call",
    resNote: "Your request is sent directly to the restaurant. We confirm every reservation by phone or e-mail within 24 hours.",
    resConfirm: "Thank you! Your reservation request has been sent successfully.",
    resError: "Something went wrong. Please try again or call us directly.",
  },
};

const STATUS = {
  fr: { open: "Ouvert maintenant", closedNow: "Fermé pour le moment", closedToday: "Fermé aujourd'hui", opens: "Ouvre", today: "aujourd'hui", tomorrow: "demain", at: "à" },
  de: { open: "Jetzt geöffnet", closedNow: "Momentan geschlossen", closedToday: "Heute geschlossen", opens: "Öffnet", today: "heute", tomorrow: "morgen", at: "um" },
  it: { open: "Aperto ora", closedNow: "Chiuso al momento", closedToday: "Chiuso oggi", opens: "Apre", today: "oggi", tomorrow: "domani", at: "alle" },
  en: { open: "Open now", closedNow: "Closed at the moment", closedToday: "Closed today", opens: "Opens", today: "today", tomorrow: "tomorrow", at: "at" },
};
