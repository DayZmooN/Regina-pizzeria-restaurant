/* ================== STATE ================== */
let currentLang = (navigator.language || "fr").slice(0, 2);
if (!LANGS.includes(currentLang)) currentLang = "fr";

let STATE = {
  content: null, // site, hero, about, faq, contact, location, branding
  menu: { categories: [] },
  gallery: [],
  reviews: { title: {}, items: [] },
  hours: [],
};

function t(field) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[currentLang] || field.fr || field.en || "";
}

/* ================== DATA LOADING ================== */
async function loadPublicData() {
  const [content, menu, gallery, reviews, hours] = await Promise.all([
    Api.get("/content"),
    Api.get("/menu"),
    Api.get("/gallery"),
    Api.get("/reviews"),
    Api.get("/hours"),
  ]);
  STATE.content = content;
  STATE.menu = menu;
  STATE.gallery = gallery;
  STATE.reviews = reviews;
  STATE.hours = hours;
}

/* ================== STATUS PILL ================== */
function findNextOpening(startIdx) {
  for (let i = 1; i <= 7; i++) {
    const idx = (startIdx + i) % 7;
    const day = STATE.hours[idx];
    if (day && !day.closed) {
      const m = day.text.match(/(\d{1,2})h(\d{2})/);
      if (m) return { idx, offset: i, time: m[1].padStart(2, "0") + "h" + m[2] };
    }
  }
  return null;
}

function updateStatusPill(todayIdx) {
  const pill = document.getElementById("statusPill");
  const label = document.getElementById("statusText");
  const today = STATE.hours[todayIdx];
  if (!today) return;
  const S = STATUS[currentLang];
  let isOpen = false, openMin = null, closeMin = null, nowMin = null;
  if (!today.closed) {
    const m = today.text.match(/(\d{1,2})h(\d{2})\s*[–\-]\s*(\d{1,2})h(\d{2})/);
    if (m) {
      const now = new Date();
      nowMin = now.getHours() * 60 + now.getMinutes();
      openMin = parseInt(m[1]) * 60 + parseInt(m[2]);
      closeMin = parseInt(m[3]) * 60 + parseInt(m[4]);
      isOpen = nowMin >= openMin && nowMin <= closeMin;
    }
  }
  pill.classList.remove("open", "closed");
  if (isOpen) {
    label.textContent = S.open + " · " + today.text;
    pill.classList.add("open");
    return;
  }
  pill.classList.add("closed");
  if (!today.closed && openMin !== null && nowMin < openMin) {
    const openTime = today.text.match(/(\d{1,2})h(\d{2})/)[0];
    label.textContent = `${S.closedNow} · ${S.opens} ${S.today} ${S.at} ${openTime}`;
    return;
  }
  const next = findNextOpening(todayIdx);
  if (next) {
    const when = next.offset === 1 ? S.tomorrow : t(STATE.hours[next.idx].day);
    const prefix = today.closed ? S.closedToday : S.closedNow;
    label.textContent = `${prefix} · ${S.opens} ${when} ${S.at} ${next.time}`;
  } else {
    label.textContent = today.closed ? S.closedToday : S.closedNow;
  }
}

/* ================== STRUCTURED DATA ================== */
function updateStructuredData() {
  const C = STATE.content;
  try {
    const base = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: t(C.site.name),
      telephone: C.contact.phone,
      email: C.contact.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: C.location.addr1,
        addressLocality: C.location.addr2,
        addressCountry: "CH",
      },
      geo: { "@type": "GeoCoordinates", latitude: C.location.lat, longitude: C.location.lng },
      acceptsReservations: "True",
      hasMenu: {
        "@type": "Menu",
        hasMenuSection: STATE.menu.categories.map((cat) => ({
          "@type": "MenuSection",
          name: t(cat.name),
          hasMenuItem: cat.items.map((it) => ({
            "@type": "MenuItem",
            name: t(it.name),
            description: t(it.desc),
            offers: { "@type": "Offer", price: it.price, priceCurrency: "CHF" },
          })),
        })),
      },
    };
    if (STATE.reviews.items.length) {
      const avg = STATE.reviews.items.reduce((s, r) => s + r.rating, 0) / STATE.reviews.items.length;
      base.aggregateRating = { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: STATE.reviews.items.length };
    }
    document.getElementById("ldJson").textContent = JSON.stringify(base);
  } catch (e) { /* non bloquant */ }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (C.faq.items || []).map((f) => ({
      "@type": "Question",
      name: t(f.q),
      acceptedAnswer: { "@type": "Answer", text: t(f.a) },
    })),
  };
  document.getElementById("ldJsonFaq").textContent = JSON.stringify(faqSchema);
}

/* ================== RENDER ================== */
function render() {
  const C = STATE.content;
  if (!C) return;
  const S = UI[currentLang];
  document.documentElement.lang = currentLang;

  document.getElementById("metaTitle").textContent = t(C.site.metaTitle);
  document.getElementById("ogTitle").setAttribute("content", t(C.site.metaTitle));
  document.getElementById("metaDesc").setAttribute("content", t(C.site.metaDesc));
  document.getElementById("ogDesc").setAttribute("content", t(C.site.metaDesc));

  // Logo / marque
  const brandHtml = t(C.site.name).replace(/(\S+)$/, "<span>$1</span>");
  const logoImg = C.branding && C.branding.logoUrl ? `<img src="${C.branding.logoUrl}" class="logo-img" alt="${t(C.site.name)}">` : "";
  document.getElementById("brandName").innerHTML = logoImg + brandHtml;
  document.getElementById("footBrand").innerHTML = (C.branding && C.branding.logoUrl ? `<img src="${C.branding.logoUrl}" class="logo-img" alt="">` : "") + t(C.site.name).replace(/(\S+)$/, '<span style="color:var(--brass)">$1</span>');

  const ids = ["#about", "#menu", "#gallery", "#visit"];
  document.getElementById("navLinks").innerHTML = S.nav.map((label, i) => `<li><a href="${ids[i]}">${label}</a></li>`).join("");
  document.getElementById("footNav").innerHTML = S.nav.map((label, i) => `<li><a href="${ids[i]}">${label}</a></li>`).join("") + `<li><a href="#reserve">${S.reserve}</a></li>`;
  document.getElementById("ctaReserve").textContent = S.reserve;
  document.getElementById("mobileLinks").innerHTML = S.nav.map((label, i) => `<li><a href="${ids[i]}">${label}</a></li>`).join("");
  document.getElementById("mobileLangSwitch").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === currentLang ? "active" : ""}">${LANG_LABELS[l]}</button>`).join("");
  document.getElementById("mobileCta").textContent = S.reserve;
  document.getElementById("footNavTitle").textContent = S.footNav;
  document.getElementById("footContactTitle").textContent = S.footContact;
  document.getElementById("openAdmin").textContent = S.admin;

  document.getElementById("langCurrentBtn").innerHTML = `${LANG_LABELS[currentLang]} <span>▾</span>`;
  document.getElementById("langMenu").innerHTML = LANGS.map((l) => `<button data-lang="${l}" class="${l === currentLang ? "active" : ""}">${LANG_LABELS[l]}</button>`).join("");

  document.getElementById("mobileCall").innerHTML = `📞 ${S.call}`;
  document.getElementById("mobileItinerary").innerHTML = `🧭 ${S.itinerary}`;
  document.getElementById("mobileBook").textContent = S.reserve;

  // hero
  const heroSec = document.getElementById("top");
  if (C.hero.imageUrl) {
    heroSec.classList.add("has-image");
    heroSec.style.backgroundImage = `url('${C.hero.imageUrl}')`;
  } else {
    heroSec.classList.remove("has-image");
    heroSec.style.backgroundImage = "";
  }
  document.getElementById("heroEyebrow").textContent = t(C.hero.eyebrow);
  document.getElementById("heroTitle").textContent = t(C.hero.title);
  document.getElementById("heroLead").textContent = t(C.hero.lead);
  document.getElementById("heroCta1").textContent = t(C.hero.cta1);
  document.getElementById("heroCta2").textContent = t(C.hero.cta2);
  document.getElementById("scrollLabel").textContent = S.scroll;

  // about
  document.getElementById("aboutTitle").textContent = t(C.about.title);
  document.getElementById("aboutText").textContent = t(C.about.text);
  document.getElementById("aboutQuote").textContent = t(C.about.quote);
  const aboutImg = document.getElementById("aboutImg");
  if (C.about.imageUrl) { aboutImg.src = C.about.imageUrl; aboutImg.style.display = "block"; }
  else { aboutImg.style.display = "none"; }
  document.getElementById("lblFounded").textContent = S.lblFounded;
  document.getElementById("lblSeats").textContent = S.lblSeats;
  document.getElementById("lblChef").textContent = S.lblChef;
  document.getElementById("lblStyle").textContent = S.lblStyle;
  document.getElementById("valFounded").textContent = C.about.founded;
  document.getElementById("valSeats").textContent = t(C.about.seats);
  document.getElementById("valChef").textContent = C.about.chef;
  document.getElementById("valStyle").textContent = t(C.site.metaTitle).split("—")[0].trim();

  // menu
  document.getElementById("menuTitle").textContent = S.nav[1];
  document.getElementById("menuNote").textContent = S.menuNote;
  const tabsEl = document.getElementById("menuTabs");
  const listsEl = document.getElementById("menuLists");
  tabsEl.innerHTML = "";
  listsEl.innerHTML = "";
  STATE.menu.categories.forEach((cat, ci) => {
    const tab = document.createElement("button");
    tab.className = "tab" + (ci === 0 ? " active" : "");
    tab.textContent = t(cat.name);
    tab.onclick = () => {
      tabsEl.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      tab.classList.add("active");
      listsEl.querySelectorAll(".menu-list").forEach((l) => l.classList.remove("active"));
      document.getElementById("mlist" + ci).classList.add("active");
    };
    tabsEl.appendChild(tab);
    const list = document.createElement("div");
    list.className = "menu-list" + (ci === 0 ? " active" : "");
    list.id = "mlist" + ci;
    list.innerHTML = cat.items.map((it) => `
      <div class="menu-item">
        ${it.imageUrl ? `<img src="${it.imageUrl}" class="dish-img" alt="${t(it.name)}">` : ""}
        <div class="info">
          <h3>${t(it.name)}<span class="dots"></span></h3>
          <p>${t(it.desc)}</p>
        </div>
        <div class="price">CHF ${it.price}</div>
      </div>`).join("");
    listsEl.appendChild(list);
  });

  // gallery
  document.getElementById("galleryTitle").textContent = S.nav[2];
  document.getElementById("galleryGrid").innerHTML = STATE.gallery.map((g, i) => `
    <div class="gcard${i === 0 ? " g1" : ""}${g.url ? "" : " no-image"}" ${g.url ? `style="background-image:url('${g.url}')"` : ""}>
      ${g.url ? "" : '<span class="ico">📷</span>'}
      <span class="cap">${t(g.caption)}</span>
    </div>`).join("");

  // hours / visit
  document.getElementById("visitTitle").textContent = S.nav[3];
  const todayIdx = (new Date().getDay() + 6) % 7;
  document.getElementById("hoursTable").innerHTML = STATE.hours.map((h, i) => `
    <tr class="${i === todayIdx ? "today" : ""}"><td>${t(h.day)}</td><td>${h.closed ? S.closed : h.text}</td></tr>`).join("");
  document.getElementById("addrLine1").textContent = C.location.addr1;
  document.getElementById("addrLine2").textContent = C.location.addr2;
  document.getElementById("addrPhone").textContent = C.contact.phone;
  document.getElementById("addrEmail").textContent = C.contact.email;
  document.getElementById("footPhone").textContent = C.contact.phone;
  document.getElementById("footEmail").textContent = C.contact.email;
  document.getElementById("footInsta").href = C.contact.instagram;

  const telHref = "tel:" + C.contact.phone.replace(/[^+\d]/g, "");
  document.getElementById("mobileCall").href = telHref;
  const subbarPhoneEl = document.getElementById("subbarPhone");
  subbarPhoneEl.href = telHref;
  subbarPhoneEl.textContent = "📞 " + C.contact.phone;
  document.getElementById("subbarAddr").textContent = "📍 " + C.location.addr1 + ", " + C.location.addr2.split(",")[0];

  const mapsQuery = `${C.location.lat},${C.location.lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  document.getElementById("subbarAddr").href = mapsUrl;
  document.getElementById("gmapsLink").href = mapsUrl;
  document.getElementById("mobileItinerary").href = mapsUrl;
  const bbox = `${C.location.lng - 0.02}%2C${C.location.lat - 0.015}%2C${C.location.lng + 0.02}%2C${C.location.lat + 0.015}`;
  document.getElementById("mapFrame").src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${mapsQuery}`;

  updateStatusPill(todayIdx);

  // reviews
  document.getElementById("reviewsTitle").textContent = t(STATE.reviews.title);
  document.getElementById("reviewsGrid").innerHTML = STATE.reviews.items.map((r) => `
    <div class="review-card">
      <div class="review-stars" aria-label="${r.rating}/5">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
      <p class="review-text">"${t(r.text)}"</p>
      <div class="review-author">${r.author}</div>
    </div>`).join("");

  // faq
  document.getElementById("faqTitle").textContent = t(C.faq.title);
  document.getElementById("faqList").innerHTML = (C.faq.items || []).map((f) => `
    <div class="faq-item" data-faq="${f.id}">
      <button class="faq-q" aria-expanded="false">${t(f.q)}<span class="plus">+</span></button>
      <div class="faq-a"><p>${t(f.a)}</p></div>
    </div>`).join("");
  document.querySelectorAll(".faq-q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const willOpen = !item.classList.contains("open");
      item.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });
  });

  updateStructuredData();

  // reservation
  document.getElementById("reserveTitle").textContent = S.reserveTitle;
  document.getElementById("lblName").textContent = S.form.name;
  document.getElementById("lblPhone").textContent = S.form.phone;
  document.getElementById("lblDate").textContent = S.form.date;
  document.getElementById("lblTime").textContent = S.form.time;
  document.getElementById("lblGuests").textContent = S.form.guests;
  document.getElementById("lblMsg").textContent = S.form.msg;
  document.getElementById("rSubmit").textContent = S.form.submit;
  document.getElementById("resNote").textContent = S.resNote;

  document.getElementById("footTagline").textContent = t(C.site.tagline);
  document.getElementById("copyright").textContent = `© ${new Date().getFullYear()} ${t(C.site.name)} — ${C.location.addr2}`;
}

/* ================== LANGUAGE SWITCH ================== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-lang]");
  if (btn) {
    const target = btn.dataset.lang;
    if (target === currentLang) { closeLangDropdown(); return; }
    currentLang = target;
    render();
    closeLangDropdown();
  }
});

const langDropdown = document.getElementById("langDropdown");
function closeLangDropdown() {
  langDropdown.classList.remove("open");
  document.getElementById("langCurrentBtn").setAttribute("aria-expanded", "false");
}
document.getElementById("langCurrentBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  const willOpen = !langDropdown.classList.contains("open");
  langDropdown.classList.toggle("open", willOpen);
  document.getElementById("langCurrentBtn").setAttribute("aria-expanded", String(willOpen));
});
document.addEventListener("click", (e) => { if (!langDropdown.contains(e.target)) closeLangDropdown(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLangDropdown(); });

/* ================== MOBILE DRAWER ================== */
const drawer = document.getElementById("mobileDrawer");
const backdrop = document.getElementById("drawerBackdrop");
function openDrawer() {
  drawer.classList.add("open"); backdrop.classList.add("open");
  document.body.classList.add("drawer-locked");
  document.getElementById("burgerBtn").setAttribute("aria-expanded", "true");
}
function closeDrawer() {
  drawer.classList.remove("open"); backdrop.classList.remove("open");
  document.body.classList.remove("drawer-locked");
  document.getElementById("burgerBtn").setAttribute("aria-expanded", "false");
}
document.getElementById("burgerBtn").addEventListener("click", openDrawer);
document.getElementById("closeMobileDrawer").addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);
drawer.addEventListener("click", (e) => { if (e.target.tagName === "A") closeDrawer(); });

/* ================== THEME TOGGLE ================== */
document.getElementById("themeToggle").addEventListener("click", () => {
  document.documentElement.classList.toggle("theme-alt");
});

/* ================== RESERVATION FORM -> API ================== */
document.getElementById("resForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("rSubmit");
  const confirmEl = document.getElementById("resConfirm");
  const S = UI[currentLang];
  const payload = {
    name: document.getElementById("rName").value,
    phone: document.getElementById("rPhone").value,
    date: document.getElementById("rDate").value,
    time: document.getElementById("rTime").value,
    guests: document.getElementById("rGuests").value,
    message: document.getElementById("rMsg").value,
  };
  btn.disabled = true;
  try {
    await Api.post("/reservations", payload);
    confirmEl.textContent = S.resConfirm;
    confirmEl.classList.add("show");
    confirmEl.style.color = "var(--brass)";
    e.target.reset();
    document.getElementById("rGuests").value = 2;
  } catch (err) {
    confirmEl.textContent = S.resError;
    confirmEl.classList.add("show");
    confirmEl.style.color = "var(--wine)";
  } finally {
    btn.disabled = false;
  }
});

/* ================== TOASTS (partagé avec admin.js) ================== */
function showToast(message, isError) {
  const host = document.getElementById("toastHost");
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

/* ================== INIT ================== */
async function init() {
  try {
    await loadPublicData();
    render();
  } catch (err) {
    console.error("Erreur de chargement du contenu :", err);
    showToast("Impossible de charger le contenu du site. Vérifiez que le serveur est démarré.", true);
  }
}
init();
