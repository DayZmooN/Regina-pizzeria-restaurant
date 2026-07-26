const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

// Lecture synchrone simple : le site est mono-instance et le volume de données
// est faible (restaurant vitrine), donc une base fichier JSON est amplement
// suffisante et évite toute dépendance à un moteur de base de données externe.
function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error(
      "Base de données introuvable. Lancez d'abord : npm run seed"
    );
  }
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// Petite file d'attente pour éviter les écritures concurrentes qui se
// écraseraient mutuellement (protection basique, suffisante ici).
let queue = Promise.resolve();
function update(mutator) {
  queue = queue.then(async () => {
    const db = readDB();
    const result = await mutator(db);
    writeDB(db);
    return result;
  });
  return queue;
}

module.exports = { readDB, writeDB, update, DB_PATH };
