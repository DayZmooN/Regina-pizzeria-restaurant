require("dotenv").config();
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const multer = require("multer");

const { readDB, update } = require("./db");
const { signToken, requireAuth } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOADS_DIR = path.join(__dirname, "..", "public", "uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

const CONTENT_KEYS = ["site", "hero", "about", "faq", "contact", "location", "branding"];

/* ------------------------------------------------------------------ */
/* AUTH                                                                */
/* ------------------------------------------------------------------ */

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis." });
  }
  const db = readDB();
  if (email.toLowerCase() !== db.admin.email.toLowerCase()) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }
  const ok = bcrypt.compareSync(password, db.admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Identifiants invalides." });
  }
  const token = signToken({ email: db.admin.email });
  res.json({ token, user: { email: db.admin.email } });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: { email: req.user.email } });
});

app.put("/api/auth/password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: "Mot de passe actuel requis, nouveau mot de passe de 6 caractères minimum." });
  }
  const db = readDB();
  const ok = bcrypt.compareSync(currentPassword, db.admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  await update((data) => {
    data.admin.passwordHash = bcrypt.hashSync(newPassword, 10);
  });
  res.json({ success: true });
});

/* ------------------------------------------------------------------ */
/* CONTENT (site / hero / about / faq / contact / location / branding) */
/* ------------------------------------------------------------------ */

app.get("/api/content", (req, res) => {
  const db = readDB();
  res.json(db.content);
});

app.put("/api/content/:key", requireAuth, async (req, res) => {
  const { key } = req.params;
  if (!CONTENT_KEYS.includes(key)) {
    return res.status(400).json({ error: "Clé de contenu inconnue : " + key });
  }
  const value = req.body;
  await update((data) => {
    data.content[key] = value;
  });
  res.json({ success: true, key, value });
});

/* ------------------------------------------------------------------ */
/* MENU                                                                */
/* ------------------------------------------------------------------ */

app.get("/api/menu", (req, res) => {
  const db = readDB();
  res.json(db.menu);
});

app.put("/api/menu", requireAuth, async (req, res) => {
  const { categories } = req.body || {};
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: "Le champ 'categories' doit être un tableau." });
  }
  await update((data) => {
    data.menu = { categories };
  });
  res.json({ success: true, menu: { categories } });
});

/* ------------------------------------------------------------------ */
/* GALLERY                                                             */
/* ------------------------------------------------------------------ */

app.get("/api/gallery", (req, res) => {
  const db = readDB();
  res.json(db.gallery);
});

app.put("/api/gallery", requireAuth, async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Le champ 'items' doit être un tableau." });
  }
  await update((data) => {
    data.gallery = items;
  });
  res.json({ success: true, gallery: items });
});

/* ------------------------------------------------------------------ */
/* REVIEWS                                                             */
/* ------------------------------------------------------------------ */

app.get("/api/reviews", (req, res) => {
  const db = readDB();
  res.json({
    title: db.reviews.title,
    items: db.reviews.items.filter((r) => r.status !== "rejected" && r.status !== "pending"),
  });
});

app.get("/api/reviews/admin", requireAuth, (req, res) => {
  const db = readDB();
  res.json(db.reviews);
});

app.post("/api/reviews", async (req, res) => {
  // Soumission publique d'un avis : passe en modération (statut "pending")
  const { author, rating, text } = req.body || {};
  if (!author || !rating || !text) {
    return res.status(400).json({ error: "Champs 'author', 'rating' et 'text' requis." });
  }
  const review = {
    id: crypto.randomUUID(),
    author: String(author).slice(0, 120),
    rating: Math.max(1, Math.min(5, parseInt(rating, 10) || 5)),
    status: "pending",
    text: typeof text === "string" ? { fr: text, en: text, it: text, de: text } : text,
  };
  await update((data) => {
    data.reviews.items.push(review);
  });
  res.status(201).json({ success: true, review });
});

app.put("/api/reviews", requireAuth, async (req, res) => {
  // Remplacement complet (titre + liste, y compris statuts) — utilisé par l'admin
  const { title, items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Le champ 'items' doit être un tableau." });
  }
  await update((data) => {
    data.reviews = { title: title || data.reviews.title, items };
  });
  res.json({ success: true });
});

/* ------------------------------------------------------------------ */
/* HOURS                                                               */
/* ------------------------------------------------------------------ */

app.get("/api/hours", (req, res) => {
  const db = readDB();
  res.json(db.hours);
});

app.put("/api/hours", requireAuth, async (req, res) => {
  const hours = req.body;
  if (!Array.isArray(hours)) {
    return res.status(400).json({ error: "Le corps de la requête doit être un tableau." });
  }
  await update((data) => {
    data.hours = hours;
  });
  res.json({ success: true, hours });
});

/* ------------------------------------------------------------------ */
/* RESERVATIONS                                                        */
/* ------------------------------------------------------------------ */

app.post("/api/reservations", async (req, res) => {
  const { name, phone, date, time, guests, message } = req.body || {};
  if (!name || !phone || !date || !time || !guests) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }
  const reservation = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 150),
    phone: String(phone).slice(0, 50),
    date,
    time,
    guests: parseInt(guests, 10) || 1,
    message: message ? String(message).slice(0, 1000) : "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await update((data) => {
    data.reservations.push(reservation);
  });
  res.status(201).json({ success: true, reservation });
});

app.get("/api/reservations", requireAuth, (req, res) => {
  const db = readDB();
  const sorted = [...db.reservations].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json(sorted);
});

app.put("/api/reservations/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};
  let found = false;
  await update((data) => {
    const r = data.reservations.find((x) => x.id === id);
    if (r) {
      Object.assign(r, patch);
      found = true;
    }
  });
  if (!found) return res.status(404).json({ error: "Réservation introuvable." });
  res.json({ success: true });
});

app.delete("/api/reservations/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  let found = false;
  await update((data) => {
    const before = data.reservations.length;
    data.reservations = data.reservations.filter((x) => x.id !== id);
    found = data.reservations.length !== before;
  });
  if (!found) return res.status(404).json({ error: "Réservation introuvable." });
  res.json({ success: true });
});

/* ------------------------------------------------------------------ */
/* UPLOADS (logo, hero, plats, galerie...)                             */
/* ------------------------------------------------------------------ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  },
});
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return cb(new Error("Type de fichier non autorisé. Formats acceptés : jpg, png, webp, gif, svg."));
    }
    cb(null, true);
  },
});

app.post("/api/uploads", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "Aucun fichier reçu." });
    res.status(201).json({ url: "/uploads/" + req.file.filename });
  });
});

/* ------------------------------------------------------------------ */

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Toute route non-API renvoie l'application (site public géré côté client)
app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`Restaurant Belvédère — serveur démarré sur http://localhost:${PORT}`);
});
