/* ================== ADMIN STATE ================== */
const ADMIN = {
  loggedIn: false,
  email: null,
  // copie de travail éditable, distincte de STATE (qui alimente le site public)
  content: null,
  menu: null,
  gallery: null,
  reviews: null,
  hours: null,
  reservations: [],
};

function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

/* ================== OPEN / CLOSE / LOGIN ================== */
const overlay = document.getElementById("adminOverlay");

document.getElementById("openAdmin").addEventListener("click", async () => {
  overlay.classList.add("open");
  if (ADMIN.loggedIn) { showAdminBody(); return; }
  const token = Api.getToken();
  if (token) {
    try {
      const me = await Api.get("/auth/me");
      ADMIN.loggedIn = true;
      ADMIN.email = me.user.email;
      showAdminBody();
      return;
    } catch (e) {
      Api.setToken(null);
    }
  }
  showLoginGate();
});

document.getElementById("passCancel").addEventListener("click", () => overlay.classList.remove("open"));

function showLoginGate() {
  document.getElementById("passGate").style.display = "block";
  document.getElementById("adminBody").style.display = "none";
}
function showAdminBody() {
  document.getElementById("passGate").style.display = "none";
  document.getElementById("adminBody").style.display = "block";
  loadAdminData();
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await Api.post("/auth/login", { email, password });
    Api.setToken(res.token);
    ADMIN.loggedIn = true;
    ADMIN.email = res.user.email;
    showAdminBody();
  } catch (err) {
    errEl.textContent = err.message || "Échec de la connexion.";
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  Api.setToken(null);
  ADMIN.loggedIn = false;
  showLoginGate();
});

/* Tentative de restauration de session au chargement de la page (sans ouvrir l'overlay) */
async function tryRestoreSession() {
  const token = Api.getToken();
  if (!token) return;
  try {
    const me = await Api.get("/auth/me");
    ADMIN.loggedIn = true;
    ADMIN.email = me.user.email;
  } catch (e) {
    Api.setToken(null);
  }
}

/* ================== LOAD ADMIN DATA ================== */
async function loadAdminData() {
  try {
    const [content, menu, gallery, reviews, hours, reservations] = await Promise.all([
      Api.get("/content"),
      Api.get("/menu"),
      Api.get("/gallery"),
      Api.get("/reviews/admin"),
      Api.get("/hours"),
      Api.get("/reservations"),
    ]);
    ADMIN.content = clone(content);
    ADMIN.menu = clone(menu);
    ADMIN.gallery = clone(gallery);
    ADMIN.reviews = clone(reviews);
    ADMIN.hours = clone(hours);
    ADMIN.reservations = reservations;
    buildAdmin();
  } catch (err) {
    showToast("Erreur de chargement des données d'administration : " + err.message, true);
  }
}

/* ================== TABS ================== */
document.querySelectorAll(".admin-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".admin-tabs button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".admin-section").forEach((s) => s.classList.remove("active"));
    const target = document.querySelector(`.admin-section[data-sec="${btn.dataset.tab}"]`);
    if (target) target.classList.add("active");
  });
});

/* ================== SHARED HELPERS ================== */
function langInputs(fieldObj, multiline) {
  fieldObj = fieldObj || {};
  return `<div class="lang-field-wrap">` + LANGS.map((l) => `
    <div class="langrow">
      <span>${l.toUpperCase()}</span>
      ${multiline
        ? `<textarea data-lang="${l}">${escapeHtml(fieldObj[l] || "")}</textarea>`
        : `<input type="text" data-lang="${l}" value="${escapeAttr(fieldObj[l] || "")}">`
      }
    </div>`).join("") + `</div>`;
}
function bindLangInputs(container, fieldObj) {
  container.querySelectorAll("[data-lang]").forEach((inp) => {
    inp.addEventListener("input", () => { fieldObj[inp.dataset.lang] = inp.value; });
  });
}
function escapeHtml(s) { return String(s).replace(/</g, "&lt;"); }
function escapeAttr(s) { return String(s).replace(/"/g, "&quot;"); }

let uploadWidgetCounter = 0;
/* Génère un widget d'upload d'image avec aperçu ; onUploaded(url) est appelé après upload réussi */
function imageUploadWidget(currentUrl, onUploaded) {
  const uid = "imgup" + (uploadWidgetCounter++);
  const wrap = document.createElement("div");
  wrap.className = "img-upload";
  wrap.innerHTML = `
    ${currentUrl ? `<img src="${currentUrl}" class="preview" id="${uid}-preview">` : `<div class="preview empty" id="${uid}-preview">🖼</div>`}
    <label class="upload-btn" for="${uid}-input">⬆ Choisir une image</label>
    <input type="file" id="${uid}-input" accept="image/*">
    <span style="font-size:0.72rem; color:var(--stone);" id="${uid}-status"></span>
  `;
  const input = wrap.querySelector(`#${uid}-input`);
  const status = wrap.querySelector(`#${uid}-status`);
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) return;
    status.textContent = "Envoi en cours…";
    try {
      const res = await Api.upload(file);
      const previewEl = wrap.querySelector(`#${uid}-preview`);
      const img = document.createElement("img");
      img.className = "preview";
      img.id = uid + "-preview";
      img.src = res.url;
      previewEl.replaceWith(img);
      status.textContent = "Image téléversée ✓";
      onUploaded(res.url);
    } catch (err) {
      status.textContent = "Erreur : " + err.message;
    }
  });
  return wrap;
}

/* ================== MAIN BUILD ================== */
function buildAdmin() {
  const root = document.getElementById("adminSections");
  root.innerHTML = `
    <div class="admin-section active" data-sec="general" id="generalSec"></div>
    <div class="admin-section" data-sec="hero" id="heroSec"></div>
    <div class="admin-section" data-sec="about" id="aboutSec"></div>
    <div class="admin-section" data-sec="menu" id="menuAdminSec"></div>
    <div class="admin-section" data-sec="gallery" id="galleryAdminSec"></div>
    <div class="admin-section" data-sec="reviews" id="reviewsAdminSec"></div>
    <div class="admin-section" data-sec="faq" id="faqAdminSec"></div>
    <div class="admin-section" data-sec="hours" id="hoursAdminSec"></div>
    <div class="admin-section" data-sec="contact" id="contactSec"></div>
    <div class="admin-section" data-sec="reservations" id="reservationsAdminSec"></div>
    <div class="admin-section" data-sec="account" id="accountSec"></div>
  `;
  buildGeneralTab();
  buildHeroTab();
  buildAboutTab();
  buildMenuAdmin();
  buildGalleryAdmin();
  buildReviewsAdmin();
  buildFaqAdmin();
  buildHoursAdmin();
  buildContactTab();
  buildReservationsAdmin();
  buildAccountTab();
  // ré-applique l'onglet actif
  const activeTab = document.querySelector(".admin-tabs button.active");
  if (activeTab) activeTab.click();
}

function saveBar(onSave) {
  const bar = document.createElement("div");
  bar.className = "admin-actions";
  bar.innerHTML = `<div class="left"></div><button class="btn btn-solid">💾 Enregistrer</button>`;
  bar.querySelector("button").addEventListener("click", async () => {
    const btn = bar.querySelector("button");
    btn.disabled = true;
    const original = btn.textContent;
    btn.textContent = "Enregistrement…";
    try {
      await onSave();
      showToast("Enregistré avec succès.");
    } catch (err) {
      showToast("Erreur : " + err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });
  return bar;
}

/* ================== GENERAL (site + branding/logo) ================== */
function buildGeneralTab() {
  const sec = document.getElementById("generalSec");
  sec.innerHTML = "";

  const logoGroup = document.createElement("div");
  logoGroup.className = "field-group";
  logoGroup.innerHTML = `<strong>Logo du restaurant</strong>`;
  logoGroup.appendChild(imageUploadWidget(ADMIN.content.branding.logoUrl, (url) => { ADMIN.content.branding.logoUrl = url; }));
  sec.appendChild(logoGroup);

  const nameGroup = document.createElement("div");
  nameGroup.className = "field-group";
  nameGroup.innerHTML = `<strong>Nom du restaurant</strong>${langInputs(ADMIN.content.site.name)}`;
  bindLangInputs(nameGroup, ADMIN.content.site.name);
  sec.appendChild(nameGroup);

  const titleGroup = document.createElement("div");
  titleGroup.className = "field-group";
  titleGroup.innerHTML = `<strong>Titre SEO (balise &lt;title&gt;)</strong>${langInputs(ADMIN.content.site.metaTitle)}`;
  bindLangInputs(titleGroup, ADMIN.content.site.metaTitle);
  sec.appendChild(titleGroup);

  const descGroup = document.createElement("div");
  descGroup.className = "field-group";
  descGroup.innerHTML = `<strong>Description SEO (meta description)</strong>${langInputs(ADMIN.content.site.metaDesc, true)}`;
  bindLangInputs(descGroup, ADMIN.content.site.metaDesc);
  sec.appendChild(descGroup);

  const tagGroup = document.createElement("div");
  tagGroup.className = "field-group";
  tagGroup.innerHTML = `<strong>Accroche (pied de page)</strong>${langInputs(ADMIN.content.site.tagline)}`;
  bindLangInputs(tagGroup, ADMIN.content.site.tagline);
  sec.appendChild(tagGroup);

  sec.appendChild(saveBar(async () => {
    await Api.put("/content/branding", ADMIN.content.branding);
    await Api.put("/content/site", ADMIN.content.site);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== HERO ================== */
function buildHeroTab() {
  const sec = document.getElementById("heroSec");
  sec.innerHTML = "";

  const imgGroup = document.createElement("div");
  imgGroup.className = "field-group";
  imgGroup.innerHTML = `<strong>Image de fond du hero</strong>`;
  imgGroup.appendChild(imageUploadWidget(ADMIN.content.hero.imageUrl, (url) => { ADMIN.content.hero.imageUrl = url; }));
  sec.appendChild(imgGroup);

  const fields = [
    ["Sur-titre (ville)", "eyebrow", false],
    ["Titre principal", "title", true],
    ["Sous-titre", "lead", true],
    ["Bouton 1", "cta1", false],
    ["Bouton 2", "cta2", false],
  ];
  fields.forEach(([label, key, multiline]) => {
    const g = document.createElement("div");
    g.className = "field-group";
    g.innerHTML = `<strong>${label}</strong>${langInputs(ADMIN.content.hero[key], multiline)}`;
    bindLangInputs(g, ADMIN.content.hero[key]);
    sec.appendChild(g);
  });

  sec.appendChild(saveBar(async () => {
    await Api.put("/content/hero", ADMIN.content.hero);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== ABOUT ================== */
function buildAboutTab() {
  const sec = document.getElementById("aboutSec");
  sec.innerHTML = "";

  const imgGroup = document.createElement("div");
  imgGroup.className = "field-group";
  imgGroup.innerHTML = `<strong>Photo (section À propos)</strong>`;
  imgGroup.appendChild(imageUploadWidget(ADMIN.content.about.imageUrl, (url) => { ADMIN.content.about.imageUrl = url; }));
  sec.appendChild(imgGroup);

  const titleG = document.createElement("div");
  titleG.className = "field-group";
  titleG.innerHTML = `<strong>Titre</strong>${langInputs(ADMIN.content.about.title)}`;
  bindLangInputs(titleG, ADMIN.content.about.title);
  sec.appendChild(titleG);

  const textG = document.createElement("div");
  textG.className = "field-group";
  textG.innerHTML = `<strong>Texte</strong>${langInputs(ADMIN.content.about.text, true)}`;
  bindLangInputs(textG, ADMIN.content.about.text);
  sec.appendChild(textG);

  const quoteG = document.createElement("div");
  quoteG.className = "field-group";
  quoteG.innerHTML = `<strong>Citation</strong>${langInputs(ADMIN.content.about.quote, true)}`;
  bindLangInputs(quoteG, ADMIN.content.about.quote);
  sec.appendChild(quoteG);

  const foundedG = document.createElement("div");
  foundedG.className = "field-group";
  foundedG.innerHTML = `<strong>Année d'ouverture</strong><input type="text" id="foundedInput" value="${escapeAttr(ADMIN.content.about.founded)}">`;
  foundedG.querySelector("#foundedInput").addEventListener("input", (e) => { ADMIN.content.about.founded = e.target.value; });
  sec.appendChild(foundedG);

  const seatsG = document.createElement("div");
  seatsG.className = "field-group";
  seatsG.innerHTML = `<strong>Places assises</strong>${langInputs(ADMIN.content.about.seats)}`;
  bindLangInputs(seatsG, ADMIN.content.about.seats);
  sec.appendChild(seatsG);

  const chefG = document.createElement("div");
  chefG.className = "field-group";
  chefG.innerHTML = `<strong>Chef de cuisine</strong><input type="text" id="chefInput" value="${escapeAttr(ADMIN.content.about.chef)}">`;
  chefG.querySelector("#chefInput").addEventListener("input", (e) => { ADMIN.content.about.chef = e.target.value; });
  sec.appendChild(chefG);

  sec.appendChild(saveBar(async () => {
    await Api.put("/content/about", ADMIN.content.about);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== MENU (catégories + plats, avec image) ================== */
function buildMenuAdmin() {
  const sec = document.getElementById("menuAdminSec");
  sec.innerHTML = "";
  ADMIN.menu.categories.forEach((cat, ci) => {
    const catDiv = document.createElement("div");
    catDiv.className = "field-group";
    catDiv.innerHTML = `
      <div class="cat-title-row">
        <h4>Catégorie ${ci + 1}</h4>
        <button class="small-btn danger" data-delcat="${ci}">Supprimer la catégorie</button>
      </div>
      ${langInputs(cat.name)}
    `;
    bindLangInputs(catDiv, cat.name);

    cat.items.forEach((item, ii) => {
      const itemGroup = document.createElement("div");
      itemGroup.style.borderTop = "1px dashed var(--line)";
      itemGroup.style.marginTop = "12px";
      itemGroup.style.paddingTop = "12px";
      itemGroup.innerHTML = `<strong>Plat ${ii + 1}</strong>`;
      itemGroup.appendChild(imageUploadWidget(item.imageUrl, (url) => { item.imageUrl = url; }));
      const nameWrap = document.createElement("div");
      nameWrap.innerHTML = `<span class="mono" style="font-size:0.72rem;color:var(--brass-soft);">Nom</span>${langInputs(item.name)}`;
      bindLangInputs(nameWrap, item.name);
      itemGroup.appendChild(nameWrap);
      const descWrap = document.createElement("div");
      descWrap.innerHTML = `<span class="mono" style="font-size:0.72rem;color:var(--brass-soft);">Description</span>${langInputs(item.desc, true)}`;
      bindLangInputs(descWrap, item.desc);
      itemGroup.appendChild(descWrap);
      const priceRow = document.createElement("div");
      priceRow.className = "langrow";
      priceRow.innerHTML = `<span>CHF</span><input type="text" value="${escapeAttr(item.price)}">`;
      priceRow.querySelector("input").addEventListener("input", (e) => { item.price = e.target.value; });
      itemGroup.appendChild(priceRow);
      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.innerHTML = `<button class="small-btn danger" data-delitem="${ci}:${ii}">Supprimer ce plat</button>`;
      itemGroup.appendChild(actions);
      catDiv.appendChild(itemGroup);
    });

    const addItemBtn = document.createElement("button");
    addItemBtn.className = "small-btn";
    addItemBtn.textContent = "+ Ajouter un plat";
    addItemBtn.style.marginTop = "14px";
    addItemBtn.addEventListener("click", () => {
      cat.items.push({ id: "item_" + Date.now(), name: { fr: "Nouveau plat", de: "Neues Gericht", it: "Nuovo piatto", en: "New dish" }, desc: { fr: "", de: "", it: "", en: "" }, price: "0", imageUrl: "" });
      buildMenuAdmin();
    });
    catDiv.appendChild(document.createElement("br"));
    catDiv.appendChild(addItemBtn);
    sec.appendChild(catDiv);
  });

  const addCatBtn = document.createElement("button");
  addCatBtn.className = "btn btn-ghost";
  addCatBtn.textContent = "+ Ajouter une catégorie";
  addCatBtn.addEventListener("click", () => {
    ADMIN.menu.categories.push({ id: "cat_" + Date.now(), name: { fr: "Nouvelle catégorie", de: "Neue Kategorie", it: "Nuova categoria", en: "New category" }, items: [] });
    buildMenuAdmin();
  });
  sec.appendChild(addCatBtn);

  sec.querySelectorAll("[data-delcat]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.menu.categories.splice(parseInt(b.dataset.delcat), 1);
    buildMenuAdmin();
  }));
  sec.querySelectorAll("[data-delitem]").forEach((b) => b.addEventListener("click", () => {
    const [ci, ii] = b.dataset.delitem.split(":").map(Number);
    ADMIN.menu.categories[ci].items.splice(ii, 1);
    buildMenuAdmin();
  }));

  sec.appendChild(saveBar(async () => {
    await Api.put("/menu", { categories: ADMIN.menu.categories });
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== GALLERY ================== */
function buildGalleryAdmin() {
  const sec = document.getElementById("galleryAdminSec");
  sec.innerHTML = "";
  ADMIN.gallery.forEach((g, gi) => {
    const group = document.createElement("div");
    group.className = "field-group";
    group.innerHTML = `<strong>Photo ${gi + 1}</strong>`;
    group.appendChild(imageUploadWidget(g.url, (url) => { g.url = url; }));
    const capWrap = document.createElement("div");
    capWrap.innerHTML = `<span class="mono" style="font-size:0.72rem;color:var(--brass-soft);">Légende</span>${langInputs(g.caption)}`;
    bindLangInputs(capWrap, g.caption);
    group.appendChild(capWrap);
    const actions = document.createElement("div");
    actions.className = "item-actions";
    actions.innerHTML = `<button class="small-btn danger" data-delg="${gi}">Supprimer cette photo</button>`;
    group.appendChild(actions);
    sec.appendChild(group);
  });
  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-ghost";
  addBtn.textContent = "+ Ajouter une photo";
  addBtn.addEventListener("click", () => {
    ADMIN.gallery.push({ id: "g_" + Date.now(), url: "", caption: { fr: "Nouvelle photo", de: "Neues Foto", it: "Nuova foto", en: "New photo" } });
    buildGalleryAdmin();
  });
  sec.appendChild(addBtn);
  sec.querySelectorAll("[data-delg]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.gallery.splice(parseInt(b.dataset.delg), 1);
    buildGalleryAdmin();
  }));

  sec.appendChild(saveBar(async () => {
    await Api.put("/gallery", { items: ADMIN.gallery });
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== REVIEWS (modération complète) ================== */
function buildReviewsAdmin() {
  const sec = document.getElementById("reviewsAdminSec");
  sec.innerHTML = `<div class="field-group"><strong>Titre de la section</strong>${langInputs(ADMIN.reviews.title)}</div>`;
  bindLangInputs(sec.querySelector(".field-group"), ADMIN.reviews.title);

  ADMIN.reviews.items.forEach((r, ri) => {
    const group = document.createElement("div");
    group.className = "field-group";
    const statusOptions = ["approved", "pending", "rejected"].map((s) => `<option value="${s}" ${r.status === s ? "selected" : ""}>${s === "approved" ? "Approuvé" : s === "pending" ? "En attente" : "Rejeté"}</option>`).join("");
    group.innerHTML = `
      <div class="langrow"><span>Nom</span><input type="text" data-author value="${escapeAttr(r.author)}"></div>
      <div class="langrow"><span>Note</span>
        <select data-rating>${[5, 4, 3, 2, 1].map((n) => `<option value="${n}" ${r.rating === n ? "selected" : ""}>${"★".repeat(n)}${"☆".repeat(5 - n)}</option>`).join("")}</select>
      </div>
      <div class="langrow"><span>Statut</span><select data-status>${statusOptions}</select></div>
      <strong>Avis</strong>${langInputs(r.text, true)}
      <div class="item-actions">
        <button class="small-btn success" data-approve="${ri}">Approuver</button>
        <button class="small-btn" data-reject="${ri}">Rejeter</button>
        <button class="small-btn danger" data-delr="${ri}">Supprimer</button>
      </div>
    `;
    bindLangInputs(group, r.text);
    group.querySelector("[data-author]").addEventListener("input", (e) => { r.author = e.target.value; });
    group.querySelector("[data-rating]").addEventListener("change", (e) => { r.rating = parseInt(e.target.value); });
    group.querySelector("[data-status]").addEventListener("change", (e) => { r.status = e.target.value; });
    sec.appendChild(group);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-ghost";
  addBtn.textContent = "+ Ajouter un avis";
  addBtn.addEventListener("click", () => {
    ADMIN.reviews.items.push({ id: "r_" + Date.now(), author: "Nouveau client", rating: 5, status: "approved", text: { fr: "", de: "", it: "", en: "" } });
    buildReviewsAdmin();
  });
  sec.appendChild(addBtn);

  sec.querySelectorAll("[data-delr]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.reviews.items.splice(parseInt(b.dataset.delr), 1);
    buildReviewsAdmin();
  }));
  sec.querySelectorAll("[data-approve]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.reviews.items[parseInt(b.dataset.approve)].status = "approved";
    buildReviewsAdmin();
  }));
  sec.querySelectorAll("[data-reject]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.reviews.items[parseInt(b.dataset.reject)].status = "rejected";
    buildReviewsAdmin();
  }));

  sec.appendChild(saveBar(async () => {
    await Api.put("/reviews", ADMIN.reviews);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== FAQ ================== */
function buildFaqAdmin() {
  const sec = document.getElementById("faqAdminSec");
  sec.innerHTML = `<div class="field-group"><strong>Titre de la section</strong>${langInputs(ADMIN.content.faq.title)}</div>`;
  bindLangInputs(sec.querySelector(".field-group"), ADMIN.content.faq.title);

  ADMIN.content.faq.items.forEach((f, fi) => {
    const group = document.createElement("div");
    group.className = "field-group";
    group.innerHTML = `
      <strong>Question</strong>${langInputs(f.q)}
      <strong style="display:block;margin-top:10px;">Réponse</strong>${langInputs(f.a, true)}
      <div class="item-actions"><button class="small-btn danger" data-delf="${fi}">Supprimer cette question</button></div>
    `;
    const wraps = group.querySelectorAll(".lang-field-wrap");
    bindLangInputs(wraps[0], f.q);
    bindLangInputs(wraps[1], f.a);
    sec.appendChild(group);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "btn btn-ghost";
  addBtn.textContent = "+ Ajouter une question";
  addBtn.addEventListener("click", () => {
    ADMIN.content.faq.items.push({ id: "faq_" + Date.now(), q: { fr: "Nouvelle question", de: "Neue Frage", it: "Nuova domanda", en: "New question" }, a: { fr: "", de: "", it: "", en: "" } });
    buildFaqAdmin();
  });
  sec.appendChild(addBtn);
  sec.querySelectorAll("[data-delf]").forEach((b) => b.addEventListener("click", () => {
    ADMIN.content.faq.items.splice(parseInt(b.dataset.delf), 1);
    buildFaqAdmin();
  }));

  sec.appendChild(saveBar(async () => {
    await Api.put("/content/faq", ADMIN.content.faq);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== HOURS ================== */
function buildHoursAdmin() {
  const sec = document.getElementById("hoursAdminSec");
  sec.innerHTML = "";
  ADMIN.hours.forEach((h) => {
    const group = document.createElement("div");
    group.className = "field-group";
    group.innerHTML = `
      <strong>${h.day.fr}</strong>
      <div class="langrow"><span>Heures</span><input type="text" data-htext value="${escapeAttr(h.text)}" placeholder="ex : 11h30 – 22h00"></div>
      <label style="display:flex; align-items:center; gap:8px; margin-top:6px; font-family:'IBM Plex Mono',monospace; font-size:0.78rem;">
        <input type="checkbox" data-hclosed ${h.closed ? "checked" : ""} style="width:auto;"> Fermé ce jour
      </label>
    `;
    group.querySelector("[data-htext]").addEventListener("input", (e) => { h.text = e.target.value; });
    group.querySelector("[data-hclosed]").addEventListener("change", (e) => { h.closed = e.target.checked; });
    sec.appendChild(group);
  });

  sec.appendChild(saveBar(async () => {
    await Api.put("/hours", ADMIN.hours);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== CONTACT ================== */
function buildContactTab() {
  const sec = document.getElementById("contactSec");
  sec.innerHTML = "";
  const fieldsHtml = `
    <div class="field-group"><strong>Adresse ligne 1</strong><input type="text" id="addr1Input" value="${escapeAttr(ADMIN.content.location.addr1)}"></div>
    <div class="field-group"><strong>Adresse ligne 2 (NPA / Ville)</strong><input type="text" id="addr2Input" value="${escapeAttr(ADMIN.content.location.addr2)}"></div>
    <div class="field-group">
      <strong>Coordonnées GPS</strong>
      <div class="langrow"><span>Lat.</span><input type="text" id="latInput" value="${ADMIN.content.location.lat}"></div>
      <div class="langrow"><span>Long.</span><input type="text" id="lngInput" value="${ADMIN.content.location.lng}"></div>
    </div>
    <div class="field-group"><strong>Téléphone</strong><input type="text" id="phoneInput" value="${escapeAttr(ADMIN.content.contact.phone)}"></div>
    <div class="field-group"><strong>E-mail</strong><input type="text" id="emailInput" value="${escapeAttr(ADMIN.content.contact.email)}"></div>
    <div class="field-group"><strong>Instagram (lien)</strong><input type="text" id="instaInput" value="${escapeAttr(ADMIN.content.contact.instagram)}"></div>
  `;
  sec.innerHTML = fieldsHtml;
  sec.querySelector("#addr1Input").addEventListener("input", (e) => { ADMIN.content.location.addr1 = e.target.value; });
  sec.querySelector("#addr2Input").addEventListener("input", (e) => { ADMIN.content.location.addr2 = e.target.value; });
  sec.querySelector("#latInput").addEventListener("input", (e) => { ADMIN.content.location.lat = parseFloat(e.target.value) || 0; });
  sec.querySelector("#lngInput").addEventListener("input", (e) => { ADMIN.content.location.lng = parseFloat(e.target.value) || 0; });
  sec.querySelector("#phoneInput").addEventListener("input", (e) => { ADMIN.content.contact.phone = e.target.value; });
  sec.querySelector("#emailInput").addEventListener("input", (e) => { ADMIN.content.contact.email = e.target.value; });
  sec.querySelector("#instaInput").addEventListener("input", (e) => { ADMIN.content.contact.instagram = e.target.value; });

  sec.appendChild(saveBar(async () => {
    await Api.put("/content/location", ADMIN.content.location);
    await Api.put("/content/contact", ADMIN.content.contact);
    await refreshPublicSiteFromAdmin();
  }));
}

/* ================== RESERVATIONS ================== */
function buildReservationsAdmin() {
  const sec = document.getElementById("reservationsAdminSec");
  if (!ADMIN.reservations.length) {
    sec.innerHTML = `<p style="color:var(--stone);">Aucune demande de réservation pour le moment.</p>`;
    return;
  }
  const rows = ADMIN.reservations.map((r) => `
    <tr data-id="${r.id}">
      <td>${escapeHtml(r.date)}<br>${escapeHtml(r.time)}</td>
      <td>${escapeHtml(r.name)}</td>
      <td>${escapeHtml(r.phone)}</td>
      <td>${r.guests}</td>
      <td>${escapeHtml(r.message || "—")}</td>
      <td>
        <select data-status>
          <option value="pending" ${r.status === "pending" ? "selected" : ""}>En attente</option>
          <option value="confirmed" ${r.status === "confirmed" ? "selected" : ""}>Confirmée</option>
          <option value="cancelled" ${r.status === "cancelled" ? "selected" : ""}>Annulée</option>
        </select>
      </td>
      <td><button class="small-btn danger" data-delres>Supprimer</button></td>
    </tr>`).join("");

  sec.innerHTML = `
    <table class="res-admin-table">
      <thead><tr><th>Date / heure</th><th>Nom</th><th>Téléphone</th><th>Pers.</th><th>Message</th><th>Statut</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  sec.querySelectorAll("tr[data-id]").forEach((tr) => {
    const id = tr.dataset.id;
    tr.querySelector("[data-status]").addEventListener("change", async (e) => {
      try {
        await Api.put(`/reservations/${id}`, { status: e.target.value });
        showToast("Statut mis à jour.");
      } catch (err) {
        showToast("Erreur : " + err.message, true);
      }
    });
    tr.querySelector("[data-delres]").addEventListener("click", async () => {
      if (!confirm("Supprimer cette réservation ?")) return;
      try {
        await Api.del(`/reservations/${id}`);
        ADMIN.reservations = ADMIN.reservations.filter((r) => r.id !== id);
        buildReservationsAdmin();
        showToast("Réservation supprimée.");
      } catch (err) {
        showToast("Erreur : " + err.message, true);
      }
    });
  });
}

/* ================== ACCOUNT (changer le mot de passe) ================== */
function buildAccountTab() {
  const sec = document.getElementById("accountSec");
  sec.innerHTML = `
    <div class="field-group">
      <strong>Compte connecté</strong>
      <p style="color:var(--paper-dim); font-size:0.9rem;">${escapeHtml(ADMIN.email || "")}</p>
    </div>
    <div class="field-group">
      <strong>Changer le mot de passe</strong>
      <div class="langrow"><span>Actuel</span><input type="password" id="curPass"></div>
      <div class="langrow"><span>Nouveau</span><input type="password" id="newPass"></div>
    </div>
  `;
  sec.appendChild(saveBar(async () => {
    const currentPassword = sec.querySelector("#curPass").value;
    const newPassword = sec.querySelector("#newPass").value;
    if (!currentPassword || !newPassword) throw new Error("Veuillez remplir les deux champs.");
    await Api.put("/auth/password", { currentPassword, newPassword });
    sec.querySelector("#curPass").value = "";
    sec.querySelector("#newPass").value = "";
  }));
}

/* ================== RE-SYNC PUBLIC SITE ================== */
async function refreshPublicSiteFromAdmin() {
  try {
    await loadPublicData();
    render();
  } catch (e) { /* le site public sera à jour au prochain chargement */ }
}

/* ================== BOOT ================== */
tryRestoreSession();
