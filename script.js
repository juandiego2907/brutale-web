/* =========================================================
   BRUTALE PIZZA · Interacciones
   ========================================================= */

// Cambia este número por el WhatsApp real de la pizzería (código de país + número, sin "+" ni espacios)
const WHATSAPP = "580000000000";

// Datos para recibir pagos. Si un campo queda vacío, en el resumen aparece "Por configurar".
const PAGOS = {
  pagoMovil: { banco: "", telefono: "", cedula: "" },
  transferencia: { banco: "", cuenta: "", titular: "", cedula: "" },
  zelle: { correo: "", titular: "" },
};

// Zonas de delivery con su costo en $. Si la lista queda vacía, solo se pide la dirección.
// Ejemplo: { nombre: "Centro", precio: 1.5 },
const SECTORES = [];

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=700&q=70`;

const SIZES = [
  { key: "ind", label: "IND." },
  { key: "fam", label: "FAM." },
  { key: "kg", label: "½ KG" },
  { key: "xl", label: "XL" },
];

// Precios tomados del menú oficial (REF $)
const MENU = {
  autor: [
    { name: "Pizza Brutale", desc: "Salsa, mozzarella, tomates en cuadrito, champiñones, jamón, pepperoni, tocineta y pecorino.", prices: [6.6, 17.85, 21.2, 44.1], img: img("1628840042765-356cda07504e"), badge: "La de la casa" },
    { name: "Pizza Sapore", desc: "Salsa, mozzarella, tocineta, champiñones y cebolla caramelizada.", prices: [5.1, 15.25, 18.55, 37.6], img: img("1513104890138-7c749659a591") },
    { name: "Pizza Toscana", desc: "Salsa, mozzarella, pepperoni, champiñones, tocineta y maíz.", prices: [5.75, 16.2, 20.1, 41.5], img: img("1565299624946-b28f40a0ae38") },
    { name: "Pizza Maiale", desc: "Salsa, mozzarella, salami, tocineta y aceitunas negras.", prices: [6.5, 18.3, 21.2, 44.7], img: img("1604382354936-07c5d9983bd3"), badge: "Feroz" },
    { name: "Hongo y Morrón", desc: "Salsa, mozzarella, jamón, champiñones y pimentón.", prices: [4.7, 13.75, 17.05, 33.8], img: img("1593560708920-61dd98c46a4e") },
    { name: "Funghi Pancetta", desc: "Salsa, mozzarella, pimentón, cebolla, champiñones, tocineta y orégano.", prices: [5.2, 15.35, 18.65, 37.9], img: img("1571407970349-bc81e7e96d47") },
    { name: "Pizza Vegetariana", desc: "Salsa, mozzarella, pimentón, cebolla, champiñones, maíz y orégano.", prices: [4.85, 14.6, 17.9, 35.9], img: img("1574071318508-1cdbab80d002"), badge: "Veggie", gold: true },
  ],
  clasicas: [
    { name: "Pizza Margarita", desc: "Salsa, mozzarella y orégano.", prices: [3.1, 9.65, 12.95, 23], img: img("1574071318508-1cdbab80d002") },
    { name: "Pizza Tradicional", desc: "Salsa, mozzarella y jamón.", prices: [3.64, 11.1, 14.4, 27.44], img: img("1595708684082-a173bb3a06c5") },
    { name: "Pizza Tocineta", desc: "Salsa, mozzarella y tocineta.", prices: [4.1, 12.2, 15.5, 30.15], img: img("1590947132387-155cc02f3212") },
    { name: "Pizza Champiñón", desc: "Salsa, mozzarella, champiñones y orégano.", prices: [3.85, 11.55, 14.84, 28.44], img: img("1571407970349-bc81e7e96d47") },
    { name: "Pizza Salami", desc: "Salsa, mozzarella y salami.", prices: [4.95, 12.9, 16.18, 31.8], img: img("1604382354936-07c5d9983bd3") },
    { name: "Pizza Napolitana", desc: "Salsa, mozzarella, anchoas y orégano.", prices: [3.8, 11.55, 14.85, 28.45], img: img("1593560708920-61dd98c46a4e") },
    { name: "Pizza Pepperoni", desc: "Salsa, mozzarella y pepperoni.", prices: [3.95, 11.8, 15.1, 29], img: img("1628840042765-356cda07504e"), badge: "Favorita" },
    { name: "Pizza Hawaiana", desc: "Salsa, mozzarella, piña, jamón o tocineta.", prices: [4.4, 12.8, 16.1, 31.55], img: img("1565299624946-b28f40a0ae38") },
  ],
  calzones: [
    { name: "Calzone Brutale", desc: "Relleno de salsa, mozzarella, jamón, tocineta, pimentón, cebolla y champiñones. Dorado al horno.", price: 6.75, img: img("1536964549204-cce9eab227bd"), emoji: "🥟", badge: "Relleno" },
  ],
  postres: [
    { name: "Postre de la casa", desc: "Dulce artesanal del día para cerrar con broche brutal. Pregunta por el sabor disponible.", price: 2.3, img: img("1571877227200-a0d98ea607e9"), emoji: "🍰" },
  ],
  bebidas: [
    { name: "Refresco de botella", desc: "Bien frío, el compañero clásico.", price: 1.1, img: img("1581006852262-e4307cf6283a"), emoji: "🥤" },
    { name: "Refresco 1,5 L", desc: "Para compartir la familiar.", price: 3.6, img: img("1622483767028-3f66f32aef97"), emoji: "🥤" },
    { name: "Refresco 2 L", desc: "Para la manada completa.", price: null, img: img("1554866585-cd94860890b7"), emoji: "🥤" },
    { name: "Nestea", desc: "Té frío refrescante.", price: 1.5, img: img("1556679343-c7306c1976bc"), emoji: "🧋" },
    { name: "Yukery", desc: "Jugo de frutas.", price: null, img: img("1600271886742-f049cd451bba"), emoji: "🧃" },
    { name: "Agua mineral", desc: "Sin gas, siempre fría.", price: 1.5, img: img("1523362628745-0c100150b504"), emoji: "💧" },
  ],
};

const EXTRAS = [
  ["Queso", 1.7, 5.05, 12.95], ["Vegetales", 1.15, 2.25, 4], ["Maíz", 1.15, 2.25, 6.2],
  ["Champiñones", 1.15, 2.25, 6.2], ["Piña", 1.15, 2.25, 6.2], ["Cebolla caramelizada", 1.15, 2.25, 6.2],
  ["Aceitunas negras", 1.15, 2.25, 6.2], ["Anchoas", 1.15, 2.25, 6.2], ["Jamón", 1.15, 2.25, 6.2],
  ["Tocineta", 1.7, 3.95, 12.35], ["Pepperoni", 1.35, 2.8, 11.2], ["Salami", 2.15, 4.15, 12.6],
  ["Pecorino", 1.15, 2.25, 6.2], ["Salsa", 1.15, 2.5, 6.2],
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => `$${n.toFixed(2)}`;
const waLink = (text = "¡Hola Brutale Pizza! Quiero hacer un pedido 🍕") =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/* ---------- Menú ---------- */
const grid = $("#menuGrid");
const plusIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

function cardHTML(item, cat, i) {
  const id = `${cat}-${i}`;
  const badge = item.badge ? `<span class="card__badge${item.gold ? " card__badge--gold" : ""}">${item.badge}</span>` : "";
  const media = `
    <div class="card__media" data-emoji="${item.emoji || "🍕"}">
      ${badge}
      <img src="${item.img}" alt="${item.name}" loading="lazy" />
    </div>`;

  if (item.prices) {
    const sizes = SIZES.map((s, k) => `
      <button class="size" type="button" data-size="${k}" aria-pressed="${k === 0}">
        <small>${s.label}</small><span>${money(item.prices[k])}</span>
      </button>`).join("");
    return `
      <article class="card" style="--i:${i}" data-id="${id}">
        ${media}
        <div class="card__body">
          <h3 class="card__title">${item.name}</h3>
          <p class="card__desc">${item.desc}</p>
          <div class="sizes" role="group" aria-label="Tamaño de ${item.name}">${sizes}</div>
          <div class="card__foot">
            <span class="price" data-price>${money(item.prices[0])}<small>IND.</small></span>
            <button class="add" type="button">${plusIcon}Añadir</button>
          </div>
        </div>
      </article>`;
  }

  const priced = item.price != null;
  return `
    <article class="card" style="--i:${i}" data-id="${id}">
      ${media}
      <div class="card__body">
        <h3 class="card__title">${item.name}</h3>
        <p class="card__desc">${item.desc}</p>
        <div class="card__foot" style="margin-top:auto">
          <span class="price${priced ? "" : " price--ask"}">${priced ? money(item.price) : "Consultar precio"}</span>
          <button class="add" type="button">${plusIcon}Añadir</button>
        </div>
      </div>
    </article>`;
}

function renderMenu(cat) {
  grid.innerHTML = MENU[cat].map((item, i) => cardHTML(item, cat, i)).join("");
  $$(".card__media img", grid).forEach((im) => {
    im.addEventListener("error", () => im.parentElement.classList.add("is-fallback"), { once: true });
  });
}

$$(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => {
      t.classList.toggle("is-active", t === tab);
      t.setAttribute("aria-selected", t === tab);
    });
    renderMenu(tab.dataset.cat);
  })
);

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const [cat, idx] = card.dataset.id.split("-");
  const item = MENU[cat][+idx];

  const sizeBtn = e.target.closest(".size");
  if (sizeBtn) {
    $$(".size", card).forEach((b) => b.setAttribute("aria-pressed", b === sizeBtn));
    const k = +sizeBtn.dataset.size;
    $("[data-price]", card).innerHTML = `${money(item.prices[k])}<small>${SIZES[k].label}</small>`;
    return;
  }

  const addBtn = e.target.closest(".add");
  if (addBtn) {
    let size = null, price = item.price;
    if (item.prices) {
      const k = +$(".size[aria-pressed='true']", card).dataset.size;
      size = SIZES[k].label;
      price = item.prices[k];
    }
    addToCart(item.name, size, price);
    addBtn.classList.add("is-added");
    addBtn.innerHTML = "✓ Añadida";
    setTimeout(() => {
      addBtn.classList.remove("is-added");
      addBtn.innerHTML = `${plusIcon}Añadir`;
    }, 1300);
  }
});

$("#extrasBody").innerHTML = EXTRAS.map(
  ([n, a, b, c]) => `<tr><td>${n}</td><td>${money(a)}</td><td>${money(b)}</td><td>${money(c)}</td></tr>`
).join("");

/* ---------- Tasa BCV (dólar oficial del día) ---------- */
// Fuente: Banco Central de Venezuela vía DolarAPI. Se guarda en el navegador y se refresca cada 30 min.
const RATE_API = "https://ve.dolarapi.com/v1/dolares/oficial";
const RATE_KEY = "brutale-tasa-bcv";
const nf = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bsRound = (n) => Math.ceil(n * 100 - 1e-6) / 100; // nunca de menos: al céntimo hacia arriba
const bs = (n) => `Bs ${nf.format(bsRound(n))}`;
const rate = { value: null, date: null, state: "loading" };

function applyRate() {
  const chip = $("#bcv");
  chip.dataset.state = rate.state;
  $("#bcvValue").textContent = rate.value ? nf.format(rate.value) : "—";
  const when = rate.date ? new Date(rate.date).toLocaleDateString("es-VE", { day: "numeric", month: "long" }) : "";
  chip.title = {
    loading: "Consultando la tasa del BCV…",
    live: `Tasa oficial BCV · vigente el ${when}`,
    cache: `Última tasa BCV guardada (${when})`,
  }[rate.state] || "Tasa BCV";
  renderCart();
}

function loadRate() {
  try {
    const saved = JSON.parse(localStorage.getItem(RATE_KEY));
    if (saved && saved.value && !rate.value) Object.assign(rate, saved, { state: "cache" });
  } catch {}
  applyRate();
  fetch(RATE_API, { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((d) => {
      const v = parseFloat(d.promedio || d.venta || d.compra);
      if (!v) throw new Error("sin tasa");
      Object.assign(rate, { value: v, date: d.fechaActualizacion || new Date().toISOString(), state: "live" });
      try { localStorage.setItem(RATE_KEY, JSON.stringify({ value: rate.value, date: rate.date })); } catch {}
    })
    .catch(() => {})
    .finally(applyRate);
}

/* ---------- Carrito y pago ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("brutale-cart")) || []; } catch { cart = []; }

const drawer = $("#drawer");
const overlay = $("#overlay");

const METHODS = [
  { id: "pagoMovil", label: "Pago Móvil", bs: true, ico: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>' },
  { id: "zelle", label: "Zelle", bs: false, ico: '<path d="M7 6h10L7 18h10"/><path d="M12 3v3M12 18v3"/>' },
  { id: "efectivoUsd", label: "Efectivo en dólares", bs: false, ico: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>' },
  { id: "efectivoBs", label: "Efectivo en bolívares", bs: true, ico: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M8 9.5h3.2a1.6 1.6 0 0 1 0 3.2H8zm0 3.2h3.6a1.6 1.6 0 0 1 0 3.3H8zM8 9.5V16"/>' },
  { id: "transferencia", label: "Transferencia", bs: true, ico: '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>' },
  { id: "tarjeta", label: "Tarjeta (punto)", bs: true, ico: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>' },
];
const methodById = (id) => METHODS.find((m) => m.id === id);

// Datos que llena quien paga, por método
const PAYER_FIELDS = {
  pagoMovil: [
    { k: "banco", label: "Banco de origen" },
    { k: "telefono", label: "Teléfono que hizo el pago", type: "tel", ph: "0414-0000000" },
    { k: "cedula", label: "Cédula del titular", ph: "V-12345678" },
    { k: "referencia", label: "Número de referencia", ph: "Últimos 6 dígitos" },
  ],
  transferencia: [
    { k: "titular", label: "Titular de la cuenta" },
    { k: "cedula", label: "Cédula del titular", ph: "V-12345678" },
    { k: "banco", label: "Banco de origen" },
    { k: "referencia", label: "Número de referencia" },
  ],
  zelle: [
    { k: "titular", label: "Titular del Zelle" },
    { k: "correo", label: "Correo o teléfono del Zelle" },
    { k: "referencia", label: "Código de confirmación" },
  ],
  efectivoUsd: [{ k: "pagaCon", label: "¿Con cuánto pagas? (para el vuelto)", ph: "Ej: $20", optional: true }],
  efectivoBs: [{ k: "pagaCon", label: "¿Con cuánto pagas? (para el vuelto)", ph: "Ej: Bs 20.000", optional: true }],
  tarjeta: [],
};
const NEEDS_PROOF = { pagoMovil: true, transferencia: true, zelle: true };
const MAX_PROOF = 8 * 1024 * 1024;

function localData(id) {
  const P = PAGOS;
  return {
    pagoMovil: [["Banco", P.pagoMovil.banco], ["Teléfono", P.pagoMovil.telefono], ["Cédula / RIF", P.pagoMovil.cedula]],
    transferencia: [["Banco", P.transferencia.banco], ["Cuenta", P.transferencia.cuenta], ["Titular", P.transferencia.titular], ["Cédula / RIF", P.transferencia.cedula]],
    zelle: [["Correo", P.zelle.correo], ["Titular", P.zelle.titular]],
  }[id] || [];
}

let step = 1; // 1: pedido · 2: pago · 3: listo
let payer = {};
let proof = null; // { file, url }
const checkout = { nombre: "", entrega: "delivery", sector: "", direccion: "", pago: "pagoMovil", notas: "" };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function saveCart() {
  try { localStorage.setItem("brutale-cart", JSON.stringify(cart)); } catch {}
}

function addToCart(name, size, price) {
  const key = `${name}|${size || ""}`;
  const line = cart.find((l) => l.key === key);
  line ? line.qty++ : cart.push({ key, name, size, price, qty: 1 });
  saveCart();
  renderCart();
  const btn = $("#cartOpen");
  btn.classList.remove("bump");
  void btn.offsetWidth;
  btn.classList.add("bump");
  toast(`🍕 ${name}${size ? ` (${size})` : ""} añadida a tu pedido`);
}

const sectorSel = () => SECTORES.find((s) => s.nombre === checkout.sector);
function totals() {
  let sub = 0, pending = 0, count = 0;
  cart.forEach((l) => { count += l.qty; l.price == null ? (pending += l.qty) : (sub += l.price * l.qty); });
  sub = Math.round(sub * 100) / 100;
  const s = checkout.entrega === "delivery" ? sectorSel() : null;
  const delivery = s ? s.precio : 0;
  return { sub, delivery, usd: Math.round((sub + delivery) * 100) / 100, pending, count };
}
function amountDue(t, m) {
  if (!m.bs) return { text: money(t.usd), copy: t.usd.toFixed(2) };
  if (!rate.value) return { text: "—", copy: "" };
  return { text: bs(t.usd * rate.value), copy: bsRound(t.usd * rate.value).toFixed(2).replace(".", ",") };
}

const stepsHTML = () => `<ol class="steps">${["Tu pedido", "Pago", "Listo"].map((n, i) =>
  `<li class="${i + 1 < step ? "done" : i + 1 === step ? "now" : ""}"><span>${i + 1}</span>${n}</li>`).join("")}</ol>`;

const linesHTML = (editable) => cart.map((l, i) => `
  <div class="line">
    <div><span class="line__name">${editable ? "" : `${l.qty}× `}${esc(l.name)}</span>${l.size ? `<span class="line__size">${esc(l.size)}</span>` : ""}</div>
    <span class="line__price">${l.price != null ? money(l.price * l.qty) : "Consultar"}</span>
    ${editable ? `<div class="qty">
      <button type="button" data-dec="${i}" aria-label="Quitar uno">−</button>
      <span>${l.qty}</span>
      <button type="button" data-inc="${i}" aria-label="Añadir uno">+</button>
    </div>` : ""}
  </div>`).join("");

function totalsHTML(t, m, compact) {
  const bsLine = rate.value ? bs(t.usd * rate.value) : "—";
  if (compact) return `<div class="drawer__total"><span>Total</span><strong>${money(t.usd)} <small>${bsLine}</small></strong></div>`;
  const del = checkout.entrega === "delivery";
  return `
    ${del && SECTORES.length ? `<div class="sub-rows"><div><span>Subtotal</span><span>${money(t.sub)}</span></div>
      <div><span>Delivery${checkout.sector ? ` · ${esc(checkout.sector)}` : ""}</span><span>${checkout.sector ? money(t.delivery) : "Elige tu zona"}</span></div></div>` : ""}
    <div class="drawer__total"><span>Total</span><strong>${money(t.usd)}</strong></div>
    <div class="bs-row"><span>${m.bs ? "A pagar en bolívares" : "Referencia en bolívares"}</span><b>${bsLine}</b></div>
    ${t.pending ? `<p class="pending">+ ${t.pending} producto(s) con precio por confirmar.</p>` : ""}
    ${del && !SECTORES.length ? `<p class="pending">El costo del delivery se confirma según tu zona.</p>` : ""}`;
}

function renderStep1(body, foot, t, m) {
  const del = checkout.entrega === "delivery";
  body.innerHTML = stepsHTML() + linesHTML(true) + `
    <div class="form">
      <label><span class="field-label">Tu nombre</span><input class="field" data-ck="nombre" maxlength="60" autocomplete="name" value="${esc(checkout.nombre)}"></label>
      <div><span class="field-label">Entrega</span><div class="seg">
        <label><input type="radio" name="entrega" value="delivery" data-ck="entrega"${del ? " checked" : ""}>Delivery</label>
        <label><input type="radio" name="entrega" value="retiro" data-ck="entrega"${del ? "" : " checked"}>Retiro en tienda</label>
      </div></div>
      ${del && SECTORES.length ? `<label><span class="field-label">Zona</span><select class="field" data-ck="sector"><option value="">Elige tu zona…</option>${
        SECTORES.map((s) => `<option value="${esc(s.nombre)}"${s.nombre === checkout.sector ? " selected" : ""}>${esc(s.nombre)} · ${money(s.precio)}</option>`).join("")}</select></label>` : ""}
      ${del ? `<label><span class="field-label">Dirección</span><textarea class="field" rows="2" data-ck="direccion" maxlength="200" placeholder="Calle, casa o edificio, punto de referencia">${esc(checkout.direccion)}</textarea></label>` : ""}
      <fieldset><legend class="field-label">Método de pago</legend><div class="paygrid">${METHODS.map((x) => `
        <label class="paytile"><input type="radio" name="pago" value="${x.id}" data-ck="pago"${x.id === checkout.pago ? " checked" : ""}>
          <svg viewBox="0 0 24 24" aria-hidden="true">${x.ico}</svg><b>${x.label}</b><small>${x.bs ? "Bolívares" : "Dólares"}</small></label>`).join("")}
      </div></fieldset>
      <label><span class="field-label">Notas (opcional)</span><input class="field" data-ck="notas" maxlength="160" value="${esc(checkout.notas)}"></label>
    </div>`;
  foot.innerHTML = totalsHTML(t, m) + `<button type="button" class="btn-complete" id="toPay">Siguiente <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`;
}

function renderStep2(body, foot, t, m) {
  const due = amountDue(t, m);
  const rows = localData(m.id);
  const fields = PAYER_FIELDS[m.id] || [];
  const entrega = checkout.entrega === "delivery"
    ? `Delivery${checkout.sector ? ` · ${esc(checkout.sector)}` : ""}${checkout.direccion ? `<br><span class="muted">${esc(checkout.direccion)}</span>` : ""}`
    : "Retiro en tienda";

  let h = stepsHTML() + `<button type="button" class="back-link" data-back>← Editar pedido</button>
    <section class="sum-card"><h4 class="sum-title">Resumen</h4>${linesHTML(false)}
      <dl class="sum-meta"><dt>Cliente</dt><dd>${esc(checkout.nombre)}</dd><dt>Entrega</dt><dd>${entrega}</dd>
      ${checkout.notas ? `<dt>Notas</dt><dd>${esc(checkout.notas)}</dd>` : ""}</dl></section>
    <section class="sum-card"><h4 class="sum-title">Paga con ${m.label}</h4>
      <div class="due"><span>Monto a pagar</span><strong>${due.text}</strong>${due.copy ? `<button type="button" class="copy" data-copy="${due.copy}">Copiar</button>` : ""}</div>`;
  h += rows.length
    ? `<ul class="copy-list">${rows.map(([k, v]) => `<li><span>${k}</span>${v
        ? `<b>${esc(v)}</b><button type="button" class="copy" data-copy="${esc(v)}">Copiar</button>`
        : `<b class="muted">Por configurar</b>`}</li>`).join("")}</ul>`
    : `<p class="muted small">${m.id === "tarjeta" ? "Pagas con tu tarjeta en el punto de venta al retirar o al recibir el pedido." : "Pagas en efectivo al retirar o al recibir tu pedido."}</p>`;
  if (m.bs && rate.value) h += `<p class="muted small">Tasa BCV del día: ${nf.format(rate.value)} Bs/$.</p>`;
  h += `</section>`;

  if (fields.length || NEEDS_PROOF[m.id]) {
    h += `<section class="sum-card"><h4 class="sum-title">${NEEDS_PROOF[m.id] ? "Datos de tu pago" : "Un detalle más"}</h4><div class="form">` +
      fields.map((f) => `<label><span class="field-label">${f.label}</span><input class="field" data-payer="${f.k}" type="${f.type || "text"}" maxlength="80"${f.ph ? ` placeholder="${f.ph}"` : ""} value="${esc(payer[f.k] || "")}"></label>`).join("");
    if (NEEDS_PROOF[m.id]) {
      h += `<div><span class="field-label">Comprobante de pago</span>
        <label class="drop${proof ? " has-file" : ""}" id="drop">
          <input type="file" id="proofInput" accept="image/*,application/pdf" class="sr-only">
          ${proof
            ? `${proof.url ? `<img src="${proof.url}" alt="Vista previa del comprobante">` : `<span class="drop-pdf">PDF</span>`}
               <span class="drop-name">${esc(proof.file.name)}</span><button type="button" class="drop-x" data-remove-proof aria-label="Quitar comprobante">✕</button>`
            : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></svg><b>Subir comprobante de pago</b><small>Captura o PDF · máx. 8 MB</small>`}
        </label></div>`;
    }
    h += `</div></section>`;
  }
  body.innerHTML = h;
  foot.innerHTML = totalsHTML(t, m, true) +
    `<p class="complete-hint" id="completeHint"></p>
     <button type="button" class="btn-complete" id="completeOrder" disabled>Confirmar pedido <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`;
  updateComplete();
}

function renderStep3(body, foot) {
  const canShare = proof && navigator.canShare && navigator.canShare({ files: [proof.file] });
  body.innerHTML = stepsHTML() + `
    <div class="done-box">
      <span class="ok-badge"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <h4>¡Pedido confirmado!</h4>
      <p>Abrimos WhatsApp con tu pedido y los datos del pago. Solo toca enviar${proof ? " y adjunta tu comprobante en el chat" : ""}.</p>
      ${canShare ? `<button type="button" class="btn btn--ghost" data-share-proof>Compartir comprobante</button>` : ""}
      <button type="button" class="link-btn" data-reopen-wa>Abrir WhatsApp de nuevo</button>
    </div>`;
  foot.innerHTML = `<button type="button" class="btn-complete" data-new-order>Hacer otro pedido</button>`;
}

function missingForPay() {
  const m = methodById(checkout.pago);
  const miss = (PAYER_FIELDS[m.id] || []).filter((f) => !f.optional && !(payer[f.k] || "").trim());
  if (miss.length) return miss.length === 1 ? `Falta: ${miss[0].label.toLowerCase()}.` : `Faltan ${miss.length} datos de tu pago.`;
  if (NEEDS_PROOF[m.id] && !proof) return "Sube el comprobante de pago para continuar.";
  return "";
}
function updateComplete() {
  const btn = $("#completeOrder");
  if (!btn) return;
  const miss = missingForPay();
  btn.disabled = !!miss;
  $("#completeHint").textContent = miss;
}
function setProof(file) {
  if (!file) return;
  if (!/^image\/|application\/pdf/.test(file.type)) return toast("Sube una imagen o un PDF");
  if (file.size > MAX_PROOF) return toast("El archivo pesa más de 8 MB");
  if (proof && proof.url) URL.revokeObjectURL(proof.url);
  proof = { file, url: /^image\//.test(file.type) ? URL.createObjectURL(file) : "" };
  renderCart();
}
function clearProof() {
  if (proof && proof.url) URL.revokeObjectURL(proof.url);
  proof = null;
}

function renderCart() {
  const t = totals();
  $("#cartCount").textContent = t.count;
  const body = $("#cartBody"), foot = $("#cartFoot");
  if (step === 3) return renderStep3(body, foot);
  if (!cart.length) {
    step = 1;
    body.innerHTML = `<div class="drawer__empty"><span>🍕</span>Tu pedido está vacío.<br />¡Ve al menú y desata tu hambre!</div>`;
    foot.innerHTML = "";
    return;
  }
  const m = methodById(checkout.pago);
  step === 2 ? renderStep2(body, foot, t, m) : renderStep1(body, foot, t, m);
}

function orderMessage() {
  const t = totals();
  const m = methodById(checkout.pago);
  const L = ["*Nuevo pedido · Brutale Pizza* 🍕", ""];
  L.push(`Cliente: ${checkout.nombre}`);
  L.push(`Entrega: ${checkout.entrega === "delivery" ? "Delivery" : "Retiro en tienda"}`);
  if (checkout.entrega === "delivery") {
    if (checkout.sector) L.push(`Zona: ${checkout.sector}`);
    if (checkout.direccion) L.push(`Dirección: ${checkout.direccion}`);
  }
  L.push("");
  cart.forEach((l) => L.push(`• ${l.qty}x ${l.name}${l.size ? ` (${l.size})` : ""} — ${l.price != null ? money(l.price * l.qty) : "precio por confirmar"}`));
  L.push("");
  if (checkout.entrega === "delivery" && checkout.sector) {
    L.push(`Subtotal: ${money(t.sub)}`);
    L.push(`Delivery (${checkout.sector}): ${money(t.delivery)}`);
  }
  L.push(`*Total: ${money(t.usd)}*${t.pending ? " + productos por confirmar" : ""}`);
  if (rate.value) L.push(`Equivalente: ${bs(t.usd * rate.value)} (tasa BCV ${nf.format(rate.value)})`);
  if (checkout.notas) L.push(`Notas: ${checkout.notas}`);
  L.push("");
  L.push(`*Pago: ${m.label}* — ${amountDue(t, m).text}`);
  (PAYER_FIELDS[m.id] || []).forEach((f) => { if ((payer[f.k] || "").trim()) L.push(`${f.label}: ${payer[f.k].trim()}`); });
  if (NEEDS_PROOF[m.id]) L.push("Comprobante: lo adjunto en este chat 📎");
  return L.join("\n");
}

function goStep(n) {
  step = n;
  renderCart();
  $("#cartBody").scrollTop = 0;
}

drawer.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
  if (inc || dec) {
    const i = +(inc || dec).dataset[inc ? "inc" : "dec"];
    if (inc) cart[i].qty++;
    else if (--cart[i].qty <= 0) cart.splice(i, 1);
    saveCart(); renderCart();
    return;
  }
  const cp = e.target.closest("[data-copy]");
  if (cp) {
    (navigator.clipboard ? navigator.clipboard.writeText(cp.dataset.copy) : Promise.reject())
      .then(() => {
        toast(`Copiado: ${cp.dataset.copy}`);
        cp.textContent = "✓ Copiado"; cp.classList.add("ok");
        setTimeout(() => { cp.textContent = "Copiar"; cp.classList.remove("ok"); }, 1600);
      }, () => toast("No se pudo copiar"));
    return;
  }
  if (e.target.closest("[data-back]")) return goStep(1);
  if (e.target.closest("[data-remove-proof]")) { e.preventDefault(); clearProof(); return renderCart(); }
  if (e.target.closest("#toPay")) {
    const del = checkout.entrega === "delivery";
    const problem = !checkout.nombre.trim() ? ["nombre", "Escribe tu nombre"]
      : del && SECTORES.length && !checkout.sector ? ["sector", "Elige tu zona de delivery"]
      : del && !checkout.direccion.trim() ? ["direccion", "Escribe la dirección del delivery"] : null;
    if (problem) {
      toast(problem[1]);
      const f = $(`[data-ck="${problem[0]}"]`, drawer); if (f) f.focus();
      return;
    }
    return goStep(2);
  }
  if (e.target.closest("#completeOrder")) {
    if (missingForPay()) return;
    window.open(waLink(orderMessage()), "_blank", "noopener");
    return goStep(3);
  }
  if (e.target.closest("[data-reopen-wa]")) return window.open(waLink(orderMessage()), "_blank", "noopener");
  if (e.target.closest("[data-share-proof]")) return navigator.share({ files: [proof.file], title: "Comprobante · Brutale Pizza" }).catch(() => {});
  if (e.target.closest("[data-new-order]")) {
    cart = []; saveCart(); payer = {}; clearProof(); checkout.notas = "";
    closeCart();
    goStep(1);
  }
});
drawer.addEventListener("input", (e) => {
  const k = e.target.dataset.ck;
  if (k && e.target.type !== "radio" && e.target.tagName !== "SELECT") checkout[k] = e.target.value;
  const p = e.target.dataset.payer;
  if (p) { payer[p] = e.target.value; updateComplete(); }
});
drawer.addEventListener("change", (e) => {
  const k = e.target.dataset.ck;
  if (k === "pago" && e.target.value !== checkout.pago) { payer = {}; clearProof(); }
  if (k === "entrega" || k === "pago" || k === "sector") { checkout[k] = e.target.value; renderCart(); }
  if (e.target.id === "proofInput") setProof(e.target.files[0]);
});
["dragover", "dragleave", "drop"].forEach((ev) => drawer.addEventListener(ev, (e) => {
  const d = e.target.closest && e.target.closest("#drop");
  if (!d) return;
  e.preventDefault();
  d.classList.toggle("over", ev === "dragover");
  if (ev === "drop") setProof(e.dataTransfer.files[0]);
}));

function openCart() {
  if (step === 3) step = 1;
  renderCart();
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeCart() {
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.style.overflow = "";
}
$("#cartOpen").addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => e.key === "Escape" && (closeCart(), closeNav()));

/* ---------- Toast ---------- */
let toastTimer;
function toast(text) {
  const t = $("#toast");
  t.textContent = text;
  t.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-visible"), 2200);
}

/* ---------- Header, nav móvil y enlaces ---------- */
const header = $("#header");
const nav = $("#nav");
const burger = $("#burger");

const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

function closeNav() {
  nav.classList.remove("is-open");
  burger.setAttribute("aria-expanded", "false");
  document.body.style.overflow = drawer.classList.contains("is-open") ? "hidden" : "";
}
burger.addEventListener("click", () => {
  const open = !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", open);
  burger.setAttribute("aria-expanded", open);
  document.body.style.overflow = open ? "hidden" : "";
});
$$("a", nav).forEach((a) => a.addEventListener("click", closeNav));

$$(".js-whatsapp").forEach((a) => (a.href = waLink()));
$$(".js-phone").forEach((el) => (el.textContent = `+${WHATSAPP}`));
$("#year").textContent = new Date().getFullYear();

// Resalta el enlace de la sección visible
const links = $$(".nav__link");
const spy = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === `#${en.target.id}`));
  }),
  { rootMargin: "-45% 0px -50% 0px" }
);
["inicio", "menu", "nosotros", "contacto"].forEach((id) => spy.observe(document.getElementById(id)));

/* ---------- Animaciones al hacer scroll ---------- */
const revealer = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-visible"); revealer.unobserve(en.target); }
  }),
  { threshold: 0.15 }
);
$$(".reveal").forEach((el) => revealer.observe(el));

renderMenu("autor");
renderCart();
loadRate();
setInterval(loadRate, 30 * 60 * 1000);
