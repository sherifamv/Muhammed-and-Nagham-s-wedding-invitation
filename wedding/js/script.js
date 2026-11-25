/* =========================================================
   EDIT THESE
   ========================================================= */
// >>> Paste your exact Google Maps link between the quotes <<<
const googleMapsLink = "https://maps.app.goo.gl/QbUvqhK5UWYj2Tjy6?g_st=iw";

// Wedding: 17 Dec 2026, 7:00 PM Cairo time. Egypt is UTC+2 in December (DST ends in October).
const WEDDING_TIME = new Date("2026-12-17T19:00:00+02:00").getTime();

// Optional real flower artwork (transparent PNG/WebP, top-left anchored). If a file is missing,
// the peonies drawn by the code below are used instead.
const FLOWER_IMAGES = {
  corner: "assets/flowers/corner.png",   // used for .corner and .mini
  mini:   "assets/flowers/corner.png",
  bottom: "assets/flowers/bottom.png"    // wide arrangement for the footer
};

/* ========================================================= */
const $ = (id) => document.getElementById(id);

/* =========================================================
   FLOWERS: procedural peonies + botanical leaves (SVG)
   ========================================================= */
const PAL = {                       // [light tip, mid, dark base]
  blush: ["#FBEAEE", "#E8B9C2", "#C98291"],
  dusty: ["#F0C9D1", "#C98291", "#9A5266"],
  wine:  ["#A04560", "#5E1424", "#330915"],
  ivory: ["#FFFFFF", "#FAF1E4", "#DCC9AB"]
};
const SETS = {
  dark:  [["blush","wine","dusty","ivory"], ["dusty","blush","wine","ivory"], ["wine","dusty","blush","ivory"]],
  light: [["blush","dusty","ivory","blush"], ["dusty","blush","ivory","dusty"], ["ivory","blush","dusty","blush"]]
};
const RINGS = [[30,46],[25,37],[19,28],[14,19],[8,10]];   // petal [width, height] per layer, outside -> inside
const COUNTS = [7,6,6,5,4];
// Layouts: br = branches [x,y,length,rotation]; fl = peonies [x,y,radius,paletteIndex]; lv = front leaves [x,y,scale,rot,group]
const LAYOUT = {
  corner: { vb: "0 0 320 320",
    br: [[0,50,270,22],[40,0,260,68],[0,130,200,6],[120,0,190,84],[0,0,320,45]],
    fl: [[108,108,86,0],[218,72,54,1],[64,218,54,2],[188,190,38,3],[270,150,26,0],[148,266,27,2]],
    lv: [[190,120,.62,25,"F"],[110,195,.6,70,"G"],[250,105,.5,10,"F"],[95,250,.5,80,"G"],[300,200,.45,40,"F"]] },
  mini: { vb: "0 0 240 240",
    br: [[0,40,200,25],[30,0,190,65],[0,0,230,45]],
    fl: [[80,80,64,0],[165,50,38,1],[48,165,38,2],[140,140,28,3]],
    lv: [[135,95,.5,30,"F"],[90,140,.5,65,"G"],[195,100,.4,15,"F"]] },
  bottom: { vb: "0 0 640 215",
    br: [[320,205,230,-172],[320,205,250,-155],[320,205,200,-130],[320,205,190,-100],[320,205,190,-80],[320,205,200,-50],[320,205,250,-25],[320,205,230,-8]],
    fl: [[320,118,62,0],[232,140,48,1],[408,140,48,2],[150,165,38,3],[490,165,38,0],[92,184,27,2],[548,184,27,1]],
    lv: [[275,100,.5,-130,"F"],[365,100,.5,-50,"G"],[190,160,.5,-170,"F"],[450,160,.5,-10,"G"]] }
};

let uid = 0;
const q = (x) => Math.round(x * 10) / 10;
const rngFrom = (a) => () => {           // small seeded random so every flower is different but stable
  a |= 0; a = (a + 0x6D2B79F5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const petalPath = (w, h) =>
  `M0 0C${q(-w*.95)} ${q(-h*.15)} ${q(-w*1.15)} ${q(-h*.7)} ${q(-w*.6)} ${q(-h*.93)}Q${q(-w*.3)} ${q(-h*1.06)} 0 ${q(-h*.95)}Q${q(w*.3)} ${q(-h*1.06)} ${q(w*.6)} ${q(-h*.93)}C${q(w*1.15)} ${q(-h*.7)} ${q(w*.95)} ${q(-h*.15)} 0 0Z`;

function defsFor(id) {
  let d = "";
  for (const k in PAL)
    d += `<radialGradient id="${id}${k}" cx=".5" cy="1" r="1.05"><stop offset="0" stop-color="${PAL[k][2]}"/><stop offset=".55" stop-color="${PAL[k][1]}"/><stop offset="1" stop-color="${PAL[k][0]}"/></radialGradient>`;
  RINGS.forEach(([w, h], k) => {
    d += `<path id="${id}R${k}" d="${petalPath(w, h)}"/><path id="${id}C${k}" d="M0 ${q(-h*.1)}Q${q(w*.12)} ${q(-h*.5)} 0 ${q(-h*.82)}"/>`;
  });
  const leaf = "M0 0C20 -30 75 -28 100 0C75 28 20 30 0 0Z", vein = "M2 0L90 0";
  d += `<linearGradient id="${id}g1"><stop offset="0" stop-color="#5d7352"/><stop offset="1" stop-color="#8FA07C"/></linearGradient>
        <linearGradient id="${id}g2"><stop offset="0" stop-color="#718765"/><stop offset="1" stop-color="#A1AD8E"/></linearGradient>
        <g id="${id}F"><path d="${leaf}" fill="url(#${id}g1)" stroke="#4f6446" stroke-opacity=".35" stroke-width=".8"/><path d="${vein}" stroke="#4f6446" stroke-opacity=".35" stroke-width=".8" fill="none"/></g>
        <g id="${id}G"><path d="${leaf}" fill="url(#${id}g2)" stroke="#4f6446" stroke-opacity=".3" stroke-width=".8"/><path d="${vein}" stroke="#4f6446" stroke-opacity=".3" stroke-width=".8" fill="none"/></g>`;
  return d;
}

function peony(x, y, r, rot, pal, rand, id) {
  let o = `<g transform="translate(${x} ${y}) rotate(${q(rot)}) scale(${q(r / 46)})">`;
  for (let k = 0; k < 5; k++) {
    const n = COUNTS[k], off = rand() * 60;
    for (let i = 0; i < n; i++) {
      const a = off + (i * 360) / n + (rand() - 0.5) * 14, sc = 0.92 + rand() * 0.16;
      o += `<g transform="rotate(${q(a)}) scale(${q(sc)})">` +
           `<use href="#${id}R${k}" fill="url(#${id}${pal})" stroke="${PAL[pal][2]}" stroke-opacity=".4" stroke-width=".6"/>` +
           `<use href="#${id}C${k}" fill="none" stroke="${PAL[pal][2]}" stroke-opacity=".35" stroke-width=".7"/></g>`;
    }
  }
  for (let i = 0; i < 9; i++) {   // golden stamens in the heart
    const a = rand() * 6.28, d = rand() * 4;
    o += `<circle cx="${q(Math.cos(a) * d)}" cy="${q(Math.sin(a) * d)}" r="1" fill="#B99A57"/>`;
  }
  return o + "</g>";
}

function branch(x, y, len, rot, rand, id) {
  const k = 0.7 + len / 400;
  let o = `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0Q${q(len*.5)} ${q(-len*.12)} ${len} ${q(len*.05)}" fill="none" stroke="#5d7352" stroke-width="2.2" stroke-linecap="round"/>`;
  for (let i = 1; i <= 6; i++) {
    const t = i / 6.5, u = 1 - t;
    const px = q(2*u*t*len*.5 + t*t*len), py = q(2*u*t*-len*.12 + t*t*len*.05);
    const s = q((0.34 + rand() * 0.18) * (1 - t * 0.4) * k);
    o += `<use href="#${id}${i % 2 ? "F" : "G"}" transform="translate(${px} ${py}) rotate(${q(-45 + rand()*16 - 8)}) scale(${s})"/>`;
    o += `<use href="#${id}${i % 2 ? "G" : "F"}" transform="translate(${px} ${py}) rotate(${q(45 + rand()*16 - 8)}) scale(${s})"/>`;
  }
  return o + `<use href="#${id}F" transform="translate(${len} ${q(len*.05)}) scale(${q(.3*k)})"/></g>`;
}

function buildFlora(type, seed, tone) {
  const L = LAYOUT[type] || LAYOUT.corner, rand = rngFrom(seed * 9973 + 7), id = "f" + (++uid) + "_";
  const set = SETS[tone === "light" ? "light" : "dark"][seed % 3];
  let body = L.br.map((b) => branch(b[0], b[1], b[2], b[3], rand, id)).join("");
  body += L.fl.map((f) => peony(f[0], f[1], f[2], rand() * 360, set[f[3]], rand, id)).join("");
  body += L.lv.map((l) => `<use href="#${id}${l[4]}" transform="translate(${l[0]} ${l[1]}) rotate(${l[3]}) scale(${l[2]})"/>`).join("");
  return `<svg viewBox="${L.vb}" aria-hidden="true" focusable="false"><defs>${defsFor(id)}</defs>${body}</svg>`;
}

document.querySelectorAll("[data-flora]").forEach((el) => {
  const type = el.dataset.flora;
  el.innerHTML = buildFlora(type, parseInt(el.dataset.seed, 10) || 1, el.dataset.tone);
  const src = FLOWER_IMAGES[type];
  if (src) {                                   // swap in your own artwork if the file exists
    const img = new Image();
    img.onload = () => { el.innerHTML = ""; el.style.backgroundImage = `url(${src})`; el.classList.add("has-img"); };
    img.src = src;
  }
});

/* =========================================================
   ENVELOPE NAMES TYPING ANIMATION
   Splits each [data-type] line on the letter into single letters; CSS fades them in one by one.
   It starts when the visitor taps the envelope, timed with the letter sliding out.
   ========================================================= */
const letterNames = $("letterNames");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let TYPING_MS = 0;                               // how long the typing takes (used to delay the screen change)

(function prepareLetterNames() {
  if (!letterNames || reduceMotion) return;      // reduced motion: names stay visible, no typing
  const STEP = 0.11;     // seconds per letter (higher = slower)
  const START = 0.9;     // wait after the tap, so the letter has started rising
  const PAUSE = 0.3;     // pause between name / & / name
  let t = START, i = 0;

  letterNames.querySelectorAll("[data-type]").forEach((line) => {
    line.textContent = "";
    line.style.setProperty("--t", t.toFixed(2) + "s");     // used by the small gold lines beside the &
    [...line.dataset.type].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      s.style.setProperty("--t", t.toFixed(2) + "s");
      s.style.setProperty("--i", i++);
      line.appendChild(s);
      t += STEP;
    });
    t += PAUSE;
  });
  TYPING_MS = Math.round((t + 0.95) * 1000);     // + the fade-in of the last letter

  const all = letterNames.querySelectorAll(".ch");
  all[all.length - 1].addEventListener("animationend", () => letterNames.classList.add("done"), { once: true });
})();

/* ---- Envelope ---- */
const intro = $("intro"), envelope = $("envelope");
let opened = false;
envelope.addEventListener("click", () => {
  if (opened) return;
  opened = true;
  envelope.classList.add("open");
  intro.classList.add("opening");
  if (letterNames && !reduceMotion) letterNames.classList.add("typing");   // names start typing
  const wait = reduceMotion ? 2100 : TYPING_MS + 900;                       // let the typing finish, then glide on
  setTimeout(() => {
    intro.classList.add("gone");
    document.body.classList.remove("locked");
    document.body.classList.add("opened");
    window.scrollTo(0, 0);
    document.querySelectorAll(".hero .reveal").forEach((el) => el.classList.add("in"));
  }, wait);
});

/* ---- Scroll reveal ---- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.2 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---- Calendar (December 2026: the 1st is a Tuesday) ---- */
(function buildCalendar() {
  const grid = $("calGrid");
  "SMTWTFS".split("").forEach((d) => grid.insertAdjacentHTML("beforeend", `<span class="h">${d}</span>`));
  const firstDay = new Date(2026, 11, 1).getDay();
  for (let i = 0; i < firstDay; i++) grid.insertAdjacentHTML("beforeend", "<span></span>");
  for (let d = 1; d <= 31; d++)
    grid.insertAdjacentHTML("beforeend", `<span class="${d === 17 ? "on" : ""}">${d}</span>`);
})();

/* ---- Countdown ---- */
const cd = { d: $("cd-d"), h: $("cd-h"), m: $("cd-m"), s: $("cd-s") };
const pad = (n) => String(n).padStart(2, "0");
function set(el, val) {
  if (el.textContent !== val) {
    el.textContent = val;
    el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
  }
}
let timerId;
function tick() {
  const diff = WEDDING_TIME - Date.now();
  if (diff <= 0) {
    $("timer").hidden = true;
    $("started").hidden = false;
    clearInterval(timerId);
    return;
  }
  set(cd.d, pad(Math.floor(diff / 864e5)));
  set(cd.h, pad(Math.floor(diff / 36e5) % 24));
  set(cd.m, pad(Math.floor(diff / 6e4) % 60));
  set(cd.s, pad(Math.floor(diff / 1e3) % 60));
}
timerId = setInterval(tick, 1000);
tick();

/* ---- Map button ---- */
$("mapBtn").addEventListener("click", () => {
  if (!googleMapsLink || googleMapsLink === "PASTE_GOOGLE_MAPS_LINK_HERE") {
    $("mapNote").hidden = false;   // link not set yet: don't open anything
    return;
  }
  window.open(googleMapsLink, "_blank", "noopener");
});

/* ---- Music (starts only on user click) ---- */
const song = $("song"), musicBtn = $("musicBtn"), label = $("musicLabel");
function setPlaying(on) {
  musicBtn.classList.toggle("playing", on);
  musicBtn.setAttribute("aria-pressed", on);
  musicBtn.setAttribute("aria-label", on ? "Pause wedding song" : "Play wedding song");
  label.textContent = on ? "Playing" : "Play our song";
}
musicBtn.addEventListener("click", async () => {
  if (song.paused) {
    try { await song.play(); setPlaying(true); }
    catch (err) { label.textContent = "Add assets/wedding-song.mp3"; console.warn("Audio failed:", err); }
  } else { song.pause(); setPlaying(false); }
});
song.addEventListener("ended", () => setPlaying(false));