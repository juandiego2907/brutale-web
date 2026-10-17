/* =====================================================================
   Brutale Pizza · interacción (plantilla de la skill web-restaurante-pedidos)
   Carrito heredado de Da Enzo / Perro Bravo (tu pedido → pago → enviado) + 3 tamaños.
   Los adicionales se eligen DESPUÉS de escoger producto y tamaño, en una hoja como la de Cumbre
   (precio según el tamaño, nota por producto y cantidad). Equivalente en bolívares (tasa BCV) en todo el sitio,
   pedido por WhatsApp SOLO después de pagar, filtro del menú, video del hero y horario en hora de Caracas.
   Script clásico (sin módulos) para que funcione también con doble clic.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var SLUG = CFG.slug || "web";
  var TX = CFG.textos || {};
  var SIZES = CFG.tamanos || ["Individual", "Familiar", "Familiar con ½ kg de queso", "XL"];
  var CMS = CFG.medidas || ["IND.", "FAM.", "½ KG", "XL"];   // etiqueta corta de cada tamaño
  var WA = String(CFG.whatsapp || "").replace(/\D/g, "");
  var IG = "https://www.instagram.com/" + (CFG.instagram || "") + "/";
  var STORE_KEY = SLUG + "-pedido-v1";
  var FORM_KEY = SLUG + "-datos-v1";
  var ITEMS = {}, ADDS = {}, ADD_ORDER = [];
  var UNIT = TX.unidad || ["producto", "productos"];   // ["pizza", "pizzas"], ["hamburguesa", "hamburguesas"]…
  (CFG.productos || []).forEach(function (p) { ITEMS[p.id] = p; });
  (CFG.adicionales || []).forEach(function (a) { ADDS[a.id] = a; ADD_ORDER.push(a.id); });

  var ICO_MINUS = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>';
  var ICO_PLUS = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICO_TRASH = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(fn) { try { fn(); } catch (err) { if (window.console) console.warn("[" + SLUG + "]", err); } }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(v) { return typeof v === "number" && isFinite(v) && v >= 0 ? v : null; }
  // Precio de un producto en un tamaño (0 Individual, 1 Mediana, 2 Grande). null = no se ofrece.
  function priceOf(id, size) { var p = ITEMS[id]; return p && p.precios ? num(p.precios[size]) : null; }
  // Precio de un adicional en un tamaño. null = no se ofrece en ese tamaño ("No aplica" en la hoja).
  // Dos formatos en config.js (se pueden mezclar):
  //   precios: [p0, p1, p2]  → precio propio por tamaño (bordes rellenos, adicionales con tabla de precios)
  //   precio: p              → precio único; en el tamaño CFG.extraDoble.tamano se multiplica por .factor (extras ×2 en la grande)
  var DOBLE = CFG.extraDoble || null;
  function addPrice(id, size) {
    var a = ADDS[id]; if (!a) return null;
    if (Array.isArray(a.precios)) return num(a.precios[size]);
    var base = num(a.precio); if (base === null) return null;
    return Math.round(base * (DOBLE && size === DOBLE.tamano ? (DOBLE.factor || 1) : 1) * 100) / 100;
  }
  function isDouble(id, size) { var a = ADDS[id]; return !!a && !Array.isArray(a.precios) && !!DOBLE && size === DOBLE.tamano && DOBLE.factor > 1; }
  function allowsExtras(id) { var p = ITEMS[id]; return !!p && !p.unico; }
  function money(n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(".", ","); }
  function P() { return window.SitePago || null; }
  function bsText(usd) {
    var pay = P(), r = pay && pay.rate();
    return r ? pay.bs(usd * r.rate) : "";
  }

  document.documentElement.classList.remove("no-js");

  /* Al recargar, la página vuelve siempre al inicio */
  safe(function () {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    var isReload = nav ? nav.type === "reload" : (performance.navigation && performance.navigation.type === 1);
    if (isReload && location.hash) history.replaceState(null, "", location.pathname + location.search);
    var toTop = function () {
      if (location.hash) return;
      var html = document.documentElement, prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      html.style.scrollBehavior = prev;
    };
    toTop();
    window.addEventListener("load", toTop);
    window.addEventListener("pageshow", function (e) { if (e.persisted) toTop(); });
  });

  /* ---------------- Tarjetas: tamaño, adicionales y precio en $ y Bs ---------------- */
  function cardChoice(card) {
    var r = $("[data-sizes] input:checked", card);
    return { size: r ? parseInt(r.value, 10) : 0 };
  }
  function lineUnit(id, size, extras) {
    var base = priceOf(id, size);
    if (base === null) return null;
    return base + (extras || []).reduce(function (a, x) { return a + (addPrice(x, size) || 0); }, 0);
  }
  function paintCard(card) {
    var id = card.getAttribute("data-id"), c = cardChoice(card);
    card.setAttribute("data-size", c.size);
    var cm = $("[data-cm]", card); if (cm) cm.textContent = CMS[c.size] || "";
    var u = priceOf(id, c.size);
    var out = $("[data-add-total]", card); if (out) out.textContent = u === null ? "Por confirmar" : money(u);
    // Producto sin precio confirmado en config.js: se ve en el menú, pero no se puede pedir
    var add = $("[data-add]", card); if (add) add.disabled = u === null;
    card.classList.toggle("is-noprice", u === null);
    var bsEl = $("[data-add-bs]", card);
    if (bsEl && u !== null) {
      var t = bsText(u), stt = P() ? P().rateState() : "error";
      bsEl.textContent = t ? "≈ " + t : (stt === "loading" || stt === "idle" ? "Bs. calculando…" : "Precio en dólares (REF.)");
    }
  }
  function paintPrices() {
    $$("[data-item]").forEach(function (card) {
      var id = card.getAttribute("data-id");
      $$("[data-sizes] label", card).forEach(function (l) {
        var input = $("input", l), p = priceOf(id, parseInt(input.value, 10));
        l.hidden = p === null;
        if (p === null && input.checked) input.checked = false;
        var b = $("[data-price]", l); if (b && p !== null) b.textContent = money(p);
      });
      if (!$("[data-sizes] input:checked", card)) {
        var first = $$("[data-sizes] label", card).filter(function (l) { return !l.hidden; })[0];
        if (first) $("input", first).checked = true;
      }
      paintCard(card);
    });
  }

  /* ---------------- Carrito ----------------
     Cada producto + tamaño + adicionales + nota es una línea distinta; dos iguales se suman.
     Los precios NO se guardan en el navegador: se leen siempre de js/config.js. */
  var cart = [];
  var els = {};

  function store(val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      localStorage.setItem(STORE_KEY, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function cleanNote(n) { return String(n || "").replace(/\s+/g, " ").trim().slice(0, 120); }
  function makeLine(id, size, extras, qty, note) {
    var p = ITEMS[id];
    if (!p) return null;
    size = parseInt(size, 10);
    if (!(size >= 0 && size < SIZES.length) || priceOf(id, size) === null) return null;
    extras = allowsExtras(id) ? (Array.isArray(extras) ? extras : []).filter(function (x, i, a) { return ADDS[x] && a.indexOf(x) === i && addPrice(x, size) !== null; }) : [];
    extras.sort(function (a, b) { return ADD_ORDER.indexOf(a) - ADD_ORDER.indexOf(b); });
    note = cleanNote(note);
    return { key: [id, size, extras.join(","), note.toLowerCase()].join("|"), id: id, size: size, extras: extras, note: note, name: p.nombre,
             qty: Math.max(1, Math.min(99, Math.floor(qty) || 1)) };
  }
  function loadCart() {
    var saved = store();
    if (!Array.isArray(saved)) return;
    saved.forEach(function (l) {
      if (!l || typeof l.id !== "string" || !(l.qty > 0)) return;
      var line = makeLine(l.id, l.size, l.extras, l.qty, l.note);
      if (!line) return;
      var same = cart.filter(function (x) { return x.key === line.key; })[0];
      if (same) same.qty = Math.min(99, same.qty + line.qty); else cart.push(line);
    });
  }
  function persist() { store(cart.map(function (l) { return { id: l.id, size: l.size, extras: l.extras, note: l.note, qty: l.qty }; })); }
  function count() { return cart.reduce(function (a, l) { return a + l.qty; }, 0); }
  function unit(l) { return lineUnit(l.id, l.size, l.extras) || 0; }
  function subtotal() { return cart.reduce(function (a, l) { return a + unit(l) * l.qty; }, 0); }
  function sizeText(l) { return ITEMS[l.id] && ITEMS[l.id].unico ? "Tamaño único" : SIZES[l.size]; }
  function extrasText(l) { return l.extras.map(function (x) { return ADDS[x].nombre; }).join(", "); }

  function addLine(id, size, extras, qty, note) {
    var line = makeLine(id, size, extras, qty, note);
    if (!line) return false;
    var found = cart.filter(function (l) { return l.key === line.key; })[0];
    if (found) found.qty = Math.min(99, found.qty + line.qty);
    else cart.push(line);
    if (els.cart && els.cart.getAttribute("data-step") === "enviado") setStep("pedido");
    persist(); render(true);
    return line;
  }
  function setQty(key, q) {
    cart = cart.map(function (l) { if (l.key === key) l.qty = Math.max(0, Math.min(99, q)); return l; })
               .filter(function (l) { return l.qty > 0; });
    persist(); render(false);
  }

  function lineHTML(l) {
    var u = unit(l), b = bsText(u * l.qty);
    var small = [sizeText(l), money(u) + (l.qty > 1 ? " c/u" : "")];
    var extra = (l.extras.length ? '<span class="line__opt">+ ' + esc(extrasText(l)) + "</span>" : "") +
      (l.note ? '<span class="line__note">“' + esc(l.note) + "”</span>" : "");
    return '<li class="line" data-line="' + esc(l.key) + '">' +
      '<span class="line__size" aria-hidden="true" title="' + esc(SIZES[l.size]) + '">' + esc(ITEMS[l.id].unico ? "C" : SIZES[l.size].charAt(0)) + "</span>" +
      '<div class="line__name"><p>' + esc(l.name) + "</p><small>" + esc(small.join(" · ")) + "</small>" + extra + "</div>" +
      '<span class="line__total"><b>' + money(u * l.qty) + "</b>" + (b ? "<small>" + b + "</small>" : "") + "</span>" +
      '<div class="line__ctrl">' +
        '<div class="stepper" role="group" aria-label="Cantidad de ' + esc(l.name) + '">' +
          '<button type="button" data-dec aria-label="Quitar una">' + ICO_MINUS + "</button>" +
          "<output>" + l.qty + "</output>" +
          '<button type="button" data-inc aria-label="Añadir una">' + ICO_PLUS + "</button>" +
        "</div>" +
        '<button type="button" class="trash" data-rm aria-label="Quitar ' + esc(l.name) + ' del pedido" title="Quitar del pedido">' + ICO_TRASH + "</button>" +
      "</div></li>";
  }

  /* Delivery con el costo del sector elegido */
  function entrega() { return els.order && els.order.entrega ? els.order.entrega.value : "Delivery"; }
  function deliveryChoice() {
    var f = els.order, pay = P();
    if (!f || entrega() !== "Delivery" || !pay || !pay.hasSectors()) return null;
    return pay.sectorInfo(f.sector.value);
  }
  /* Cajas: con Delivery cada pizza suma la caja de su tamaño (CFG.cajasDelivery). Con Retiro no se cobran. */
  function cajas() {
    var out = { items: [], total: 0 }, by = {}, tabla = CFG.cajasDelivery || [];
    if (entrega() !== "Delivery") return out;
    cart.forEach(function (l) {
      var p = ITEMS[l.id], c = tabla[l.size];
      if (!p || p.unico || !c || typeof c[1] !== "number") return;
      if (!by[c[0]]) { by[c[0]] = { nombre: c[0], precio: c[1], qty: 0 }; out.items.push(by[c[0]]); }
      by[c[0]].qty += l.qty;
      out.total += c[1] * l.qty;
    });
    out.total = Math.round(out.total * 100) / 100;
    return out;
  }
  // Costo del sector y nota de entrega (con las cajas que ya van en el total); se repinta en cada render()
  function paintDelivery() {
    var box = $("[data-delivery-cost]"), noteEl = $("[data-delivery-note]");
    if (!box || !noteEl || !els.order) return;
    var isDelivery = entrega() === "Delivery", info = deliveryChoice(), cj = cajas();
    box.hidden = !info;
    if (info) box.innerHTML = "<span>Delivery a " + esc(info.nombre) + "</span><b>" + (info.sinCosto ? "Por confirmar" : money(info.costo || 0)) + "</b>";
    var cajaTxt = cj.items.length ? " Las cajas (" + cj.items.map(function (c) { return c.qty + " × " + c.nombre.toLowerCase(); }).join(", ") + ": " + money(cj.total) + ") ya están en el total." : "";
    noteEl.textContent = isDelivery
      ? (info ? (info.sinCosto ? "El costo del delivery a este sector está por confirmar." : "El delivery se suma al total que pagas en el siguiente paso.") : "Elige tu sector para sumar el delivery al total.") + cajaTxt
      : "Retiras tu pedido en " + (CFG.lugarRetiro || "el local") + ". Te avisamos por WhatsApp cuando esté listo.";
  }
  function grand() { var d = deliveryChoice(); return cart.length ? subtotal() + cajas().total + (d && d.costo ? d.costo : 0) : 0; }

  function render(bumped) {
    var n = count(), s = subtotal(), g = grand();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; });
    $$("[data-dock-total]").forEach(function (el) { el.textContent = money(s); });
    $$("[data-dock-bs]").forEach(function (el) { el.textContent = s ? bsText(s) : ""; });
    $$("[data-cart-total]").forEach(function (el) { el.textContent = money(g); });
    $$("[data-cart-bs]").forEach(function (el) {
      var t = g ? bsText(g) : "";
      el.textContent = t ? "≈ " + t + " · tasa BCV" : "";
    });
    if (bumped) $$(".badge, .dock__count").forEach(function (b) { b.classList.remove("is-bump"); void b.offsetWidth; b.classList.add("is-bump"); });

    if (n === 0 && els.cart.getAttribute("data-step") === "pago") setStep("pedido");
    els.cart.classList.toggle("is-empty", n === 0);
    els.sub.textContent = n ? n + " " + (n === 1 ? UNIT[0] : UNIT[1]) + " en tu pedido" : "Todavía no has elegido nada";
    els.lines.innerHTML = cart.map(lineHTML).join("");
    paintDelivery();

    var dock = $("[data-dock]");
    if (dock) {
      dock.hidden = false;
      dock.classList.toggle("is-on", n > 0 && !document.body.classList.contains("cart-open"));
    }
    document.body.classList.toggle("has-dock", n > 0);   // el pie deja espacio para la barra
    var navCart = $(".nav__cart");
    if (navCart) navCart.setAttribute("aria-label", "Abrir tu pedido, " + n + " " + (n === 1 ? UNIT[0] : UNIT[1]));
  }

  /* ---------------- Pasos del carrito: 1 pedido → 2 pago → enviado ---------------- */
  function setStep(step) {
    els.cart.setAttribute("data-step", step);
    $$("[data-flow-step]").forEach(function (li) {
      var stp = li.getAttribute("data-flow-step");
      li.classList.toggle("is-on", stp === step);
      li.classList.toggle("is-done", step === "pago" && stp === "pedido");
    });
    els.cart.scrollTop = 0;
    var body = $(".cart__body", els.cart); if (body) body.scrollTop = 0;
  }
  function fail(field, msg) {
    els.error.textContent = msg;
    var fld = field.closest(".field"); if (fld) fld.classList.add("is-invalid");
    field.focus();
  }
  function goPay() {
    var f = els.order;
    if (!cart.length) return;
    if (blockedNow()) return;
    if (!f.nombre.value.trim()) return fail(f.nombre, "Escribe tu nombre para saber a quién va el pedido.");
    var isDelivery = entrega() === "Delivery";
    if (isDelivery && P() && P().hasSectors() && !f.sector.value) return fail(f.sector, "Elige tu sector: así sumamos el delivery al total que vas a pagar.");
    if (isDelivery && f.direccion.value.trim().length < 6) {
      return fail(f.direccion, "Escribe la dirección con un punto de referencia.");
    }
    if (!P()) { els.error.textContent = "No pudimos cargar el paso de pago. Recarga la página e inténtalo de nuevo."; return; }
    P().enter({ root: $("[data-pay]"), subtotal: subtotal(), delivery: deliveryChoice(), entrega: entrega(), cajas: cajas() });
    setStep("pago");
  }

  /* ---------------- Mensaje de WhatsApp (el pedido llega YA PAGADO) ---------------- */
  function buildMessage(pay, proofUrl) {
    var f = els.order, out = [], d = deliveryChoice(), s = subtotal(), cj = cajas();
    var cost = d ? (d.costo || 0) : 0, total = s + cj.total + cost;
    out.push(TX.saludo || "¡Hola, *" + (CFG.nombre || "") + "*!");
    out.push(TX.intro || "Hice este pedido en la web y ya está *pagado*:");
    out.push("");
    out.push("🧾 *MI PEDIDO*");
    cart.forEach(function (l) {
      out.push("• " + l.qty + " × " + l.name + " (" + sizeText(l) + ") — " + money(unit(l) * l.qty));
      // Desglose: precio base del tamaño y cada adicional con SU precio (y "doble" si aplica la regla del tamaño grande)
      if (l.extras.length) {
        out.push("     Base " + money(priceOf(l.id, l.size)));
        l.extras.forEach(function (x) { out.push("     + " + ADDS[x].nombre + " " + money(addPrice(x, l.size)) + (isDouble(x, l.size) ? " (doble)" : "")); });
        if (l.qty > 1) out.push("     = " + money(unit(l)) + " c/u");
      }
      if (l.note) out.push("     📝 " + l.note);
    });
    out.push("");
    out.push("Subtotal: " + money(s));
    cj.items.forEach(function (c) { out.push("📦 " + c.qty + " × " + c.nombre + ": " + money(c.precio * c.qty)); });
    if (d) out.push("🛵 Delivery (" + d.nombre + "): " + (d.sinCosto ? "por confirmar" : money(cost)));
    out.push("💰 *TOTAL: " + money(total) + "*");
    out.push("");
    out.push("✅ *PAGO REALIZADO: " + pay.metodo + "*");
    out.push("💵 Monto pagado: *" + pay.montoBs + "* (tasa BCV Bs. " + pay.tasaTxt + ")");
    if (pay.telefono) out.push("📱 Teléfono del pago: " + pay.telefono);
    if (pay.cedula) out.push("🪪 Cédula del titular: " + pay.cedula);
    if (proofUrl) out.push("🧾 Comprobante: " + proofUrl);
    else out.push("🧾 Comprobante: se los adjunto en este chat.");
    out.push("");
    out.push("👤 Nombre: " + f.nombre.value.trim());
    if (entrega() === "Delivery") {
      out.push("🛵 Entrega: Delivery");
      if (d) out.push("🗺️ Sector: " + d.nombre + (d.zona ? " (" + d.zona + ")" : ""));
      out.push("📍 Dirección: " + f.direccion.value.trim().replace(/\s+/g, " "));
    } else {
      out.push("🏠 Entrega: Retiro en " + (CFG.lugarRetiro || "el local"));
    }
    if (f.notas.value.trim()) out.push("📝 Notas: " + f.notas.value.trim());
    if (!status().open && canOrder()) { out.push(""); out.push("⏰ Lo pedí fuera de horario; lo espero cuando abran."); }
    out.push("");
    out.push(TX.cierre || "¡Gracias!");
    return out.join("\n");
  }
  function waUrl(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }

  function send() {
    if (blockedNow()) return;
    if (!WA) { toast("Falta configurar el WhatsApp del local (js/config.js)"); return; }
    var pay = P().validate();
    if (!pay) return;
    var btn = $("[data-send-btn]"), label = btn.querySelector("span");
    // La ventana se abre YA (en el toque del cliente) para que el navegador no la bloquee mientras sube el comprobante
    var win = window.open("", "_blank");
    if (win) {
      try {
        win.opener = null;
        win.document.title = "Abriendo WhatsApp…";
        win.document.body.style.cssText = "margin:0;display:grid;place-items:center;height:100vh;background:" + (CFG.colorFondo || "#fff") + ";color:" + (CFG.colorTexto || "#222") + ";font:700 22px system-ui,sans-serif";
        win.document.body.textContent = TX.abriendo || "Preparando tu pedido…";
      } catch (e) {}
    }
    btn.classList.add("is-busy");
    if (label) label.textContent = "Subiendo comprobante…";
    var job = P().upload(pay.file);
    job.then(function (proofUrl) {
      var url = waUrl(buildMessage(pay, proofUrl));
      if (win && !win.closed) win.location.href = url;
      else location.href = url;
      btn.classList.remove("is-busy");
      if (label) label.textContent = "Pedir por WhatsApp";
      var reopen = $("[data-reopen-wa]"); if (reopen) reopen.href = url;
      var note = $("[data-sent-note]"), share = $("[data-share-proof]");
      var missing = pay.file && !proofUrl;
      note.hidden = !missing && !proofUrl;
      note.innerHTML = missing
        ? "<b>Falta tu comprobante:</b> adjunta la captura del pago en el chat de WhatsApp antes de enviar."
        : "Tu comprobante va en el mensaje como un enlace privado para el local.";
      share.hidden = !(missing && P().canShareFile());
      setStep("enviado");
    });
  }

  /* ---------------- Abrir / cerrar carrito ---------------- */
  var lastFocus = null;
  var INERT = "main, .header, .footer, .dock";
  function openCart() {
    lastFocus = document.activeElement;
    els.scrim.hidden = false;
    els.cart.classList.add("is-open");
    els.cart.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { els.scrim.classList.add("is-on"); });
    document.body.classList.add("cart-open");
    document.documentElement.classList.add("lock");
    $$(INERT).forEach(function (el) { el.setAttribute("inert", ""); });
    if (P()) P().loadRate(false);
    paintClosed();
    render(false);
    setTimeout(function () { els.cart.focus({ preventScroll: true }); }, 60);
  }
  function closeCart() {
    if (!els.cart.classList.contains("is-open")) return;
    els.cart.classList.remove("is-open");
    els.cart.setAttribute("aria-hidden", "true");
    els.scrim.classList.remove("is-on");
    document.body.classList.remove("cart-open");
    document.documentElement.classList.remove("lock");
    $$(INERT).forEach(function (el) { el.removeAttribute("inert"); });
    setTimeout(function () { if (!els.cart.classList.contains("is-open")) els.scrim.hidden = true; }, 450);
    if (els.cart.getAttribute("data-step") === "enviado") setStep("pedido");
    render(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  /* ---------------- Feedback al añadir ---------------- */
  var toastTimer;
  function toast(t) {
    var el = $("[data-toast]"); if (!el) return;
    el.textContent = t; el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("is-on"); }, 2200);
  }
  function fly(fromBtn) {
    if (reduced || !fromBtn || !document.body.animate) return;
    var dock = $("[data-dock]");
    var target = dock && dock.classList.contains("is-on") && getComputedStyle(dock).display !== "none" ? $(".dock__count") : $(".nav__cart .badge");
    if (!target) return;
    var a = fromBtn.getBoundingClientRect(), b = target.getBoundingClientRect();
    var f = document.createElement("span");
    f.className = "flyer"; f.setAttribute("aria-hidden", "true");
    document.body.appendChild(f);
    var x0 = a.left + a.width / 2 - 20, y0 = a.top + a.height / 2 - 20;
    var x1 = b.left + b.width / 2 - 20, y1 = b.top + b.height / 2 - 20;
    var anim = f.animate([
      { transform: "translate(" + x0 + "px," + y0 + "px) rotate(0) scale(1)", opacity: 1 },
      { transform: "translate(" + ((x0 + x1) / 2) + "px," + (Math.min(y0, y1) - 110) + "px) rotate(200deg) scale(1.2)", opacity: 1, offset: .5 },
      { transform: "translate(" + x1 + "px," + y1 + "px) rotate(400deg) scale(.35)", opacity: .3 }
    ], { duration: 720, easing: "cubic-bezier(.5,0,.3,1)" });
    anim.onfinish = function () { f.remove(); };
  }
  var ADDED = TX.anadido || ["¡Añadido!"];
  function flash(btn) {
    if (!btn) return;
    var label = $("[data-add-label]", btn);
    btn.classList.add("is-added");
    if (label) label.textContent = ADDED[Math.floor(Math.random() * ADDED.length)];
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.classList.remove("is-added");
      if (label) label.textContent = "Añadir al carrito";
    }, 1300);
  }

  function initCart() {
    els.cart = $("[data-cart]"); els.scrim = $("[data-scrim]");
    els.lines = $("[data-cart-lines]"); els.sub = $("[data-cart-sub]");
    els.order = $("[data-order]");
    els.error = $("[data-form-error]");
    loadCart();

    // Cambiar tamaño o adicionales actualiza el dibujo y el precio de la tarjeta
    document.addEventListener("change", function (e) {
      var card = e.target.closest && e.target.closest("[data-item]");
      if (card) paintCard(card);
    });

    document.addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        var node = addBtn.closest("[data-item]");
        if (!node) return;
        var c = cardChoice(node);
        if (node.hasAttribute("data-custom")) { openSheet(node, c.size, addBtn); return; }
        var line = addLine(node.getAttribute("data-id"), c.size, [], 1, "");
        if (!line) return;
        flash(addBtn); fly(addBtn);
        toast(line.name + " · a tu pedido");
        return;
      }
      if (e.target.closest("[data-cart-open]")) { e.preventDefault(); openCart(); return; }
      if (e.target.closest("[data-cart-close]") || e.target === els.scrim) {
        var goMenu = e.target.closest("[data-goto-menu]");
        closeCart();
        if (goMenu) setTimeout(function () { var m = $("#menu"); if (m) m.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); }, 120);
        return;
      }
      var lineEl = e.target.closest("[data-line]");
      if (lineEl) {
        var key = lineEl.getAttribute("data-line");
        var cur = cart.filter(function (l) { return l.key === key; })[0];
        if (!cur) return;
        var inc = e.target.closest("[data-inc]"), dec = e.target.closest("[data-dec]");
        if (inc) setQty(key, cur.qty + 1);
        else if (dec) setQty(key, cur.qty - 1);
        else if (e.target.closest("[data-rm]")) setQty(key, 0);
        else return;
        var again = $$("[data-line]", els.lines).filter(function (x) { return x.getAttribute("data-line") === key; })[0];
        if (again && (inc || dec)) $(inc ? "[data-inc]" : "[data-dec]", again).focus();
        else els.cart.focus({ preventScroll: true });
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { if (closeSheet()) return; closeCart(); return; }
      if (e.key === "Tab" && els.cart.classList.contains("is-open")) {
        var f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', els.cart)
          .filter(function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === els.cart)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    $("[data-clear-cart]").addEventListener("click", function () { cart = []; persist(); setStep("pedido"); render(false); els.cart.focus({ preventScroll: true }); });

    // Los datos del formulario se recuerdan en este navegador para el próximo pedido
    var f = els.order;
    var sectorSel = $("[data-sector-select]");
    if (sectorSel && P() && P().hasSectors()) sectorSel.innerHTML = P().sectorOptions();
    var data = (function () { try { return JSON.parse(localStorage.getItem(FORM_KEY) || "null") || {}; } catch (e) { return {}; } })();
    ["nombre", "direccion", "sector", "notas"].forEach(function (k) { if (typeof data[k] === "string" && f[k]) f[k].value = data[k]; });
    if (sectorSel && sectorSel.selectedIndex < 0) sectorSel.value = "";
    if (data.entrega) $$('input[name="entrega"]', f).forEach(function (r) { r.checked = r.value === data.entrega; });

    function syncDelivery() {
      var isDelivery = entrega() === "Delivery";
      $("[data-address-field]").hidden = !isDelivery;
      $("[data-sector-field]").hidden = !isDelivery || !P() || !P().hasSectors();
      render(false);   // render() repinta el costo del sector y la nota de cajas (paintDelivery)
    }
    f.addEventListener("input", function (e) {
      var d = {};
      ["nombre", "direccion", "sector", "notas"].forEach(function (k) { d[k] = f[k] ? f[k].value : ""; });
      d.entrega = entrega();
      try { localStorage.setItem(FORM_KEY, JSON.stringify(d)); } catch (err) {}
      var fld = e.target.closest && e.target.closest(".field"); if (fld) fld.classList.remove("is-invalid");
      els.error.textContent = "";
    });
    f.addEventListener("change", syncDelivery);
    f.addEventListener("submit", function (e) { e.preventDefault(); goPay(); });
    syncDelivery();

    $("[data-next-btn]").addEventListener("click", goPay);
    $("[data-send-btn]").addEventListener("click", function () { if (blockedNow() || !P()) return; send(); });
    $("[data-back-btn]").addEventListener("click", function () { setStep("pedido"); });
    $("[data-new-order]").addEventListener("click", function () {
      cart = []; persist();
      if (P()) P().reset();
      setStep("pedido"); render(false);
      els.cart.focus({ preventScroll: true });
    });
    $("[data-share-proof]").addEventListener("click", function () {
      if (P()) P().shareFile("Comprobante de pago · pedido de " + f.nombre.value.trim());
    });

    render(false);
  }

  /* ---------------- Hoja de adicionales (como en Cumbre) ----------------
     Se abre al tocar "Añadir al carrito" en un producto con data-custom: ya se sabe el producto y el tamaño,
     así que los adicionales salen con el precio de ESE tamaño. Nota y cantidad por producto. */
  var sheet = { card: null, id: "", size: 0, qty: 1, opener: null };
  function sheetEl() { return $("[data-sheet]"); }
  function sheetExtras() { return $$("[data-sheet-extras] input:checked").map(function (i) { return i.value; }); }
  function sheetRender() {
    var u = lineUnit(sheet.id, sheet.size, sheetExtras()) || 0, t = u * sheet.qty;
    $("[data-sheet-qty]").textContent = sheet.qty;
    $("[data-sheet-total]").textContent = money(t);
    var b = bsText(t); $("[data-sheet-bs]").textContent = b ? "≈ " + b : "";
    $$("[data-sheet-extras] .xtra").forEach(function (l) { l.classList.toggle("is-on", $("input", l).checked); });
    var dec = $('[data-sheet-step="-1"]'); if (dec) dec.disabled = sheet.qty <= 1;
  }
  function openSheet(card, size, opener) {
    var el = sheetEl(); if (!el) return;
    var id = card.getAttribute("data-id");
    if (priceOf(id, size) === null) return;
    sheet.card = card; sheet.id = id; sheet.size = size; sheet.qty = 1; sheet.opener = opener || document.activeElement;
    var art = $(".pz__svg, .pz__photo", card);
    $("[data-sheet-art]").innerHTML = art ? art.outerHTML : "";
    $("[data-sheet-name]").textContent = card.getAttribute("data-name");
    $("[data-sheet-size]").textContent = SIZES[size];
    $("[data-sheet-size-name]").textContent = SIZES[size];
    $("[data-sheet-base]").textContent = money(priceOf(id, size));
    // Agrupados por "tipo" (p. ej. Bordes rellenos / Extras); sin tipo = una sola lista.
    // Un adicional que no existe en ese tamaño sale desactivado con "No aplica"; los que van doble llevan "×2".
    var xtra = function (aid) {
      var pr = addPrice(aid, size), off = pr === null;
      return '<label class="xtra' + (off ? " is-off" : "") + '"><input type="checkbox" value="' + esc(aid) + '"' + (off ? " disabled" : "") + ">" +
        '<span class="xtra__box" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
        '<span class="xtra__name">' + esc(ADDS[aid].nombre) + '</span><span class="xtra__price">' +
        (off ? "No aplica" : "+" + money(pr) + (isDouble(aid, size) ? ' <em class="x2">×2</em>' : "")) + "</span></label>";
    };
    var TIPOS = CFG.tiposAdicional || [["borde", "Bordes rellenos"], ["extra", "Extras"]];
    var typed = ADD_ORDER.some(function (a) { return ADDS[a].tipo; });
    $("[data-sheet-extras]").innerHTML = !typed ? ADD_ORDER.map(xtra).join("") : TIPOS.map(function (t) {
      var ids = ADD_ORDER.filter(function (a) { return (ADDS[a].tipo || "extra") === t[0]; });
      return ids.length ? '<fieldset class="xtras__group"><legend>' + esc(t[1]) + '</legend><div class="xtras__grid">' + ids.map(xtra).join("") + "</div></fieldset>" : "";
    }).join("");
    $("[data-sheet-note]").value = "";
    sheetRender();
    $(".sheet__body", el).scrollTop = 0;
    var scrim = $(".sheet-scrim"); scrim.hidden = false;
    el.setAttribute("aria-hidden", "false");
    requestAnimationFrame(function () { scrim.classList.add("is-on"); el.classList.add("is-open"); });
    document.body.classList.add("sheet-open");
    document.documentElement.classList.add("lock");
    $$(INERT).forEach(function (n) { n.setAttribute("inert", ""); });
    setTimeout(function () { el.focus({ preventScroll: true }); }, 60);
  }
  function closeSheet() {
    var el = sheetEl(); if (!el || !el.classList.contains("is-open")) return false;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    var scrim = $(".sheet-scrim"); scrim.classList.remove("is-on");
    document.body.classList.remove("sheet-open");
    if (!document.body.classList.contains("cart-open")) {
      document.documentElement.classList.remove("lock");
      $$(INERT).forEach(function (n) { n.removeAttribute("inert"); });
    }
    setTimeout(function () { if (!el.classList.contains("is-open")) scrim.hidden = true; }, 350);
    if (sheet.opener && sheet.opener.focus) sheet.opener.focus({ preventScroll: true });
    return true;
  }
  function initSheet() {
    var el = sheetEl(); if (!el) return;
    el.addEventListener("change", sheetRender);
    $$("[data-sheet-close]").forEach(function (b) { b.addEventListener("click", closeSheet); });
    $$("[data-sheet-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        sheet.qty = Math.max(1, Math.min(20, sheet.qty + parseInt(b.getAttribute("data-sheet-step"), 10)));
        sheetRender();
      });
    });
    $("[data-sheet-note]").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("[data-sheet-add]").click(); } });
    $("[data-sheet-add]").addEventListener("click", function () {
      var qty = sheet.qty;
      var line = addLine(sheet.id, sheet.size, sheetExtras(), qty, $("[data-sheet-note]").value);
      var btn = sheet.opener && sheet.opener.closest ? sheet.opener.closest("[data-add]") : null;
      closeSheet();
      if (!line) return;
      flash(btn); fly(btn);
      toast((qty > 1 ? qty + " × " : "") + line.name + " " + SIZES[line.size].toLowerCase() + (line.extras.length ? " con adicionales" : "") + " · a tu pedido");
    });
    el.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = $$("button, input, [href]", el).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (P()) P().onRate(function () { if (el.classList.contains("is-open")) sheetRender(); });
  }

  /* ---------------- Tasa BCV en la interfaz ---------------- */
  function initRate() {
    var pay = P(); if (!pay) return;
    pay.onRate(function (r, state) {
      $$("[data-bcv-rate]").forEach(function (el) {
        el.textContent = r ? "Bs. " + pay.rateTxt(r.rate) : (state === "error" ? "sin conexión" : "…");
      });
      var v = $("[data-rate-value]"), d = $("[data-rate-date]"), box = $("[data-ratebox]");
      if (v) v.textContent = r ? "Bs. " + pay.rateTxt(r.rate) + " por $1" : (state === "error" ? "No disponible" : "Consultando…");
      if (d) d.textContent = r
        ? (r.date ? "Vigente desde el " + pay.fmtDate(r.date) : "Banco Central de Venezuela") + (state === "stale" ? " · última disponible" : "")
        : (state === "error" ? "Los precios se muestran en dólares (REF.)" : "Banco Central de Venezuela");
      if (box) box.classList.toggle("is-error", state === "error");
      $$("[data-item]").forEach(paintCard);
      render(false);
    });
    pay.loadRate(false);
    // Si la página queda abierta, la tasa se revisa cada hora (y al cambiar de día)
    setInterval(function () { if (!document.hidden) pay.loadRate(false); }, 3600 * 1000);
  }

  /* ---------------- Horario (hora de Caracas) ---------------- */
  function caracasNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Caracas", weekday: "short", hour: "numeric", minute: "numeric", hour12: false })
        .formatToParts(new Date());
      var get = function (t) { return (parts.filter(function (p) { return p.type === t; })[0] || {}).value; };
      var dayN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
      return { day: dayN, min: (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() }; }
  }
  function toMin(t) { var p = String(t).split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1] || 0, 10); }
  function fmt(t) {
    var m = toMin(t), h = Math.floor(m / 60), mm = m % 60;
    if (h === 12 && mm === 0) return "12:00 m";
    return (h % 12 || 12) + ":" + (mm < 10 ? "0" : "") + mm + " " + (h < 12 ? "am" : "pm");
  }
  var DAYS = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];
  function hoursOf(d) { var H = CFG.horario || {}; return H[d] || H[String(d)] || null; }
  function status() {
    // Sin horario cargado en config.js: no se bloquean los pedidos
    if (!CFG.horario) return { open: true, text: "Horario por confirmar" };
    var now = caracasNow(), today = hoursOf(now.day);
    if (today && now.min >= toMin(today.abre) && now.min < toMin(today.cierra)) {
      return { open: true, text: "Abierto ahora · hasta las " + fmt(today.cierra) };
    }
    if (today && now.min < toMin(today.abre)) return { open: false, text: "Cerrado · abrimos hoy a las " + fmt(today.abre), next: "hoy a las " + fmt(today.abre) };
    for (var i = 1; i <= 7; i++) {
      var d = (now.day + i) % 7, h = hoursOf(d);
      if (h) {
        var when = (i === 1 ? "mañana" : DAYS[d]) + " a las " + fmt(h.abre);
        return { open: false, text: "Cerrado · abrimos " + when, next: when };
      }
    }
    return { open: false, text: "Cerrado por ahora" };
  }
  function paintStatus() {
    var st = status();
    $$("[data-status]").forEach(function (el) { el.classList.toggle("is-open", st.open); el.classList.toggle("is-closed", !st.open); });
    $$("[data-status-text]").forEach(function (el) { el.textContent = st.text; });
    return st;
  }
  function canOrder() { return CFG.pedidosFueraDeHorario === true || status().open; }
  function paintClosed() {
    var st = status(), el = $("[data-cart-closed]"), allowed = canOrder();
    if (el) {
      el.hidden = st.open;
      el.classList.toggle("is-blocked", !allowed);
      if (!st.open) el.innerHTML = allowed
        ? "<b>Estamos cerrados en este momento.</b> Puedes enviar tu pedido igual: abrimos " + esc(st.next || "pronto") + "."
        : "<b>Estamos cerrados.</b> Puedes armar tu pedido y dejarlo listo; lo pagas y envías apenas abramos: " + esc(st.next || "pronto") + ".";
    }
    $$("[data-next-btn], [data-send-btn]").forEach(function (b) {
      var label = b.querySelector("span");
      if (label && !b._label) b._label = label.textContent;
      b.disabled = !allowed;
      b.classList.toggle("is-closed", !allowed);
      if (label) label.textContent = allowed ? b._label : "Abrimos " + (st.next || "pronto");
    });
  }
  function blockedNow() {
    paintClosed();
    if (canOrder()) return false;
    var st = status();
    toast("Estamos cerrados · abrimos " + (st.next || "pronto"));
    var el = $("[data-cart-closed]");
    if (el && els.cart.classList.contains("is-open")) el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    return true;
  }
  function initStatus() {
    paintStatus();
    paintClosed();
    setInterval(function () { if (!document.hidden) { paintStatus(); paintClosed(); } }, 60000);
  }

  /* ---------------- Filtro del menú ---------------- */
  function initFilter() {
    var bar = $("[data-filters]"); if (!bar) return;
    var cards = $$("[data-item]");
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filter]"); if (!b) return;
      var v = b.getAttribute("data-filter");
      $$("[data-filter]", bar).forEach(function (x) {
        var on = x === b;
        x.classList.toggle("is-on", on);
        x.setAttribute("aria-pressed", on ? "true" : "false");
      });
      cards.forEach(function (c) {
        var tags = (c.getAttribute("data-tags") || "").split(" ");
        c.hidden = v !== "todas" && tags.indexOf(v) < 0;
        if (!c.hidden) c.classList.add("is-in");
      });
      var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h"), 10) || 68;
      var top = $("[data-menu]").getBoundingClientRect().top + window.scrollY - bar.offsetHeight - navH - 12;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      if (b.parentNode.scrollWidth > b.parentNode.clientWidth) {
        b.parentNode.scrollTo({ left: b.offsetLeft - 16, behavior: reduced ? "auto" : "smooth" });
      }
    });
  }

  /* ---------------- Hero: video de fondo ---------------- */
  function initHeroVideo() {
    var box = $("[data-hero-media]"), v = $("[data-hero-video]");
    if (!box || !v) return;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (reduced || saveData) return;               // queda la foto fija del mismo video
    v.addEventListener("playing", function () { box.classList.add("has-video"); }, { once: true });
    v.src = window.innerWidth < 760 ? v.getAttribute("data-src-mobile") : v.getAttribute("data-src");
    v.muted = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause(); });
      }, { threshold: 0.01 }).observe(box);
    }
  }

  /* ---------------- Navegación ---------------- */
  function initNav() {
    var nav = $("[data-nav]");
    function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 24); }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Menú del celular (pantalla completa)
    var links = $("[data-nav-links]"), burger = $("[data-burger]");
    function setMenu(open) {
      links.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.documentElement.classList.toggle("lock", open || document.body.classList.contains("cart-open"));
    }
    if (links && burger) {
      burger.addEventListener("click", function () { setMenu(!links.classList.contains("is-open")); });
      $$("a", links).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("is-open")) setMenu(false); });
    }

    // Resalta el enlace de la sección visible
    var navLinks = $$("[data-nav-links] a[href^='#']");
    if ("IntersectionObserver" in window) {
      var spy = new IntersectionObserver(function (en) {
        en.forEach(function (x) {
          if (x.isIntersecting) navLinks.forEach(function (l) { l.classList.toggle("is-active", l.getAttribute("href") === "#" + x.target.id); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      navLinks.forEach(function (l) { var s = document.getElementById(l.getAttribute("href").slice(1)); if (s) spy.observe(s); });
    }
  }

  /* ---------------- Aparición al hacer scroll ---------------- */
  function initReveal() {
    var items = $$(".rv");
    if (!("IntersectionObserver" in window)) { items.forEach(function (x) { x.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("is-in"); io.unobserve(x.target); } });
    }, { threshold: 0.05, rootMargin: "0px 0px -5% 0px" });
    items.forEach(function (x, i) {
      if (x.classList.contains("pz") || x.classList.contains("info") || x.classList.contains("panel")) x.style.transitionDelay = (i % 3) * 80 + "ms";
      io.observe(x);
    });
    // red de seguridad: el contenido nunca se queda oculto (saltos de ancla, pestañas en segundo plano, scroll muy rápido)
    var pending = false;
    function sweep() {
      pending = false;
      items = items.filter(function (x) {
        if (x.classList.contains("is-in")) return false;
        if (x.getBoundingClientRect().top < innerHeight * 1.05) { x.classList.add("is-in"); io.unobserve(x); return false; }
        return true;
      });
      if (!items.length) window.removeEventListener("scroll", onScroll);
    }
    function onScroll() { if (!pending) { pending = true; setTimeout(sweep, 120); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    setTimeout(sweep, 1800);
  }

  function initLinks() {
    $$("[data-ig]").forEach(function (a) { a.href = IG; });
    var y = $("[data-year]"); if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(paintPrices);
    safe(initCart);
    safe(initRate);
    safe(initStatus);
    safe(initFilter);
    safe(initSheet);
    safe(initHeroVideo);
    safe(initNav);
    safe(initReveal);
    safe(initLinks);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
