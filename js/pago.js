/* Brutale Pizza · tasa BCV + paso de pago del carrito (plantilla de la skill web-restaurante-pedidos).
   - Tasa oficial BCV VIGENTE hoy (hora de Caracas): DolarApi y, de respaldo, nuestro servidor (api/tasa-bcv.php).
     Se consulta al abrir la página: el menú, el carrito y el WhatsApp muestran el equivalente en bolívares.
   - Pago en la web: Pago móvil o Transferencia con los datos del local (js/config.js → pagos) y botón "Copiar".
     Siempre se pide teléfono, cédula y comprobante: a WhatsApp llega el pedido completo YA PAGADO.
   - Sectores de delivery con su costo (se suma al total que se paga).
   Script clásico + IIFE: expone window.SitePago. */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || { pagos: {}, delivery: [] };
  var SLUG = CFG.slug || "web";
  var API = "api/";
  var RATE_KEY = SLUG + "-tasa-bcv-v1";
  var PAYER_KEY = SLUG + "-pagador-v1";
  var METHODS = [
    { id: "pagoMovil", label: "Pago móvil",
      ico: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>' },
    { id: "transferencia", label: "Transferencia",
      ico: '<path d="M3 9.5 12 4l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20.5h18"/>' }
  ];

  var st = { rest: SLUG, root: null, subtotal: 0, totalUsd: 0, delivery: null, entrega: "Delivery",
             rate: null, rateState: "idle", method: "pagoMovil", file: null, previewUrl: "" };
  var listeners = [];

  /* ---------------- utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function usd(n) { return "$" + (Math.round(n * 100) / 100).toFixed(2).replace(".", ","); }
  function thousands(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function bsNum(n) {
    var v = Math.ceil(n * 100 - 1e-6) / 100;   // nunca de menos: se redondea al céntimo hacia arriba
    var parts = v.toFixed(2).split(".");
    return thousands(parts[0]) + "," + parts[1];
  }
  function bs(n) { return "Bs. " + bsNum(n); }
  function bsPlain(n) { return (Math.ceil(n * 100 - 1e-6) / 100).toFixed(2).replace(".", ","); }
  function rateTxt(r) { var p = (Math.round(r * 100) / 100).toFixed(2).split("."); return thousands(p[0]) + "," + p[1]; }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "";
  }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || "null");
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function method(id) { return METHODS.filter(function (m) { return m.id === id; })[0] || METHODS[0]; }
  function account(id) { return (CFG.pagos || {})[id] || {}; }
  function copy(text, btn) {
    var done = function () {
      if (!btn) return;
      btn.classList.add("is-copied");
      var label = btn.querySelector("span"); if (label) label.textContent = "¡Copiado!";
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { btn.classList.remove("is-copied"); if (label) label.textContent = "Copiar"; }, 1600);
    };
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;opacity:0;top:0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }
  function timeoutFetch(url, ms, opts) {
    var ctl = "AbortController" in window ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, ms);
    var o = opts || {}; if (ctl) o.signal = ctl.signal;
    return fetch(url, o).then(function (r) { clearTimeout(t); return r; }, function (e) { clearTimeout(t); throw e; });
  }
  var COPY_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/></svg>';

  /* ---------------- tasa BCV ----------------
     El BCV publica cada tasa con una "fecha valor" (el día desde el que rige). Los viernes y antes de un
     feriado ya publica la del siguiente día hábil, así que la ÚLTIMA publicada no siempre es la de HOY.
     Se usa siempre la VIGENTE: la más reciente cuya fecha valor es hoy o anterior (hora de Caracas). */
  function todayCaracas() {
    try {
      var p = {};
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Caracas", year: "numeric", month: "2-digit", day: "2-digit" })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      return p.year + "-" + p.month + "-" + p.day;
    } catch (e) {
      return new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);   // Venezuela = UTC-4
    }
  }
  function day(iso) { var m = /^(\d{4}-\d{2}-\d{2})/.exec(iso || ""); return m ? m[1] : ""; }
  function getJSON(url) {
    return timeoutFetch(url, 7000, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function pickVigente(list, today) {
    var ok = list.filter(function (x) { return x.rate > 0 && x.date && x.date <= today; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return ok.length ? ok[ok.length - 1] : null;
  }
  // 1) DolarApi (pública): tasa actual; si su fecha valor todavía no llegó, se busca la vigente en su historial
  function fromDolarApi(today) {
    return getJSON("https://ve.dolarapi.com/v1/dolares/oficial").then(function (j) {
      var cur = { rate: +j.promedio, date: day(j.fechaActualizacion) };
      if (cur.rate > 0 && cur.date && cur.date <= today) return cur;
      return getJSON("https://ve.dolarapi.com/v1/historicos/dolares/oficial").then(function (h) {
        var hit = pickVigente((h || []).map(function (x) { return { rate: +x.promedio, date: day(x.fecha) }; }), today);
        if (!hit) throw new Error("sin tasa vigente");
        return hit;
      });
    });
  }
  // 2) Nuestro servidor (lee bcv.org.ve y devuelve la vigente). Solo con la web publicada.
  function fromServer(today) {
    if (!/^https?:$/.test(location.protocol)) return Promise.reject(new Error("sin servidor"));
    return getJSON(API + "tasa-bcv.php").then(function (j) {
      var out = { rate: +j.tasa, date: day(j.fecha) };
      if (!(out.rate > 0) || (out.date && out.date > today)) throw new Error("tasa inválida");
      return out;
    });
  }

  var ratePromise = null;
  function emit() {
    paint();
    listeners.forEach(function (fn) { try { fn(st.rate, st.rateState); } catch (e) {} });
  }
  function loadRate(force) {
    var today = todayCaracas();
    var cached = store(RATE_KEY);
    // La tasa guardada solo sirve el MISMO día y nunca si es "del futuro"
    var cacheOk = cached && cached.rate > 0 && cached.dia === today && (!cached.date || cached.date <= today);
    if (!force && cacheOk && Date.now() - cached.at < 3 * 3600 * 1000) {
      st.rate = cached; st.rateState = "ok"; emit(); return Promise.resolve(cached);
    }
    if (ratePromise) return ratePromise;
    st.rateState = "loading"; emit();
    ratePromise = fromDolarApi(today)
      .catch(function () { return fromServer(today); })
      .then(function (out) {
        var rec = { rate: out.rate, date: out.date || "", dia: today, at: Date.now() };
        store(RATE_KEY, rec); st.rate = rec; st.rateState = "ok"; return rec;
      }, function () {
        // Sin conexión: la última tasa guardada (máx. 4 días) si no es "del futuro"
        if (cached && cached.rate > 0 && (!cached.date || cached.date <= today) && Date.now() - cached.at < 4 * 86400 * 1000) {
          st.rate = cached; st.rateState = "stale"; return cached;
        }
        st.rate = null; st.rateState = "error"; return null;
      })
      .then(function (r) { ratePromise = null; emit(); return r; });
    return ratePromise;
  }

  /* ---------------- sectores de delivery (opcional) ---------------- */
  function hasSectors() { return (CFG.delivery || []).some(function (g) { return g && g.sectores && g.sectores.length; }); }
  function sectorOptions() {
    var html = '<option value="">Elige tu sector…</option>';
    (CFG.delivery || []).forEach(function (g, gi) {
      html += '<optgroup label="' + esc(g.zona) + '">';
      (g.sectores || []).forEach(function (s, si) {
        html += '<option value="' + gi + "." + si + '">' + esc(s[0]) + " · " + (typeof s[1] === "number" ? usd(s[1]) : "costo por confirmar") + "</option>";
      });
      html += "</optgroup>";
    });
    return html;
  }
  function sectorInfo(value) {
    if (!value) return null;
    var p = String(value).split("."), g = (CFG.delivery || [])[+p[0]], s = g && g.sectores && g.sectores[+p[1]];
    if (!s) return null;
    return { nombre: s[0], zona: g.zona, costo: typeof s[1] === "number" ? s[1] : 0, sinCosto: typeof s[1] !== "number" };
  }

  /* ---------------- interfaz del paso de pago ---------------- */
  function rowHTML(label, value, copyable) {
    return '<div class="acct__row' + (value ? "" : " is-empty") + '"><dt>' + esc(label) + "</dt><dd>" + esc(value || "Por configurar") + "</dd>" +
      (copyable && value ? '<button type="button" class="copy" data-copy="' + esc(value) + '" aria-label="Copiar ' + esc(label) + '">' + COPY_SVG + "<span>Copiar</span></button>" : "<i></i>") +
      "</div>";
  }

  function build(root) {
    var saved = store(PAYER_KEY) || {};
    root.innerHTML =
      '<div class="pay__sum" data-p-sum></div>' +
      '<fieldset class="pay__methods"><legend>¿Cómo vas a pagar?</legend>' +
        METHODS.map(function (m) {
          return '<label><input type="radio" name="metodo" value="' + m.id + '"' + (m.id === st.method ? " checked" : "") + ">" +
            '<span><svg viewBox="0 0 24 24" aria-hidden="true">' + m.ico + "</svg>" + m.label + "</span></label>";
        }).join("") +
      "</fieldset>" +
      '<div class="pay__bs" data-p-bs aria-live="polite"></div>' +
      '<div class="acct" data-p-acct></div>' +
      '<div class="proof" data-p-proof>' +
        '<h4 class="proof__title">Datos de tu pago</h4>' +
        '<div class="field"><label for="p-tel">Teléfono desde el que pagaste</label>' +
          '<input id="p-tel" name="p-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="0412-1234567" maxlength="16" value="' + esc(saved.tel || "") + '"></div>' +
        '<div class="field"><label for="p-ced">Cédula del titular del pago</label>' +
          '<div class="ced"><select id="p-ced-tipo" name="p-ced-tipo" aria-label="Tipo de documento">' +
            ["V", "E", "J", "P"].map(function (t) { return "<option" + (saved.tipo === t ? " selected" : "") + ">" + t + "</option>"; }).join("") +
          '</select><input id="p-ced" name="p-ced" type="text" inputmode="numeric" autocomplete="off" placeholder="12345678" maxlength="10" value="' + esc(saved.ced || "") + '"></div></div>' +
        '<div class="field"><span class="field__label" id="p-file-l">Comprobante de pago</span>' +
          '<label class="drop" data-drop>' +
            '<input type="file" accept="image/*,application/pdf" data-file aria-labelledby="p-file-l">' +
            '<span class="drop__empty"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15"/></svg>' +
              "<b>Toca para cargar el comprobante</b><small>Captura o foto (JPG, PNG) o PDF · máx. 8 MB</small></span>" +
            '<span class="drop__full"><img alt="" data-thumb><span class="drop__doc">PDF</span><span class="drop__name" data-fname></span><span class="drop__change">Cambiar</span></span>' +
          "</label></div>" +
      "</div>" +
      '<p class="pay__note" data-p-note></p>' +
      '<p class="checkout__error" data-p-error role="alert"></p>';

    root.addEventListener("change", function (e) {
      if (e.target.name === "metodo") { st.method = e.target.value; clearError(); paint(); }
      if (e.target.matches("[data-file]")) takeFile(e.target.files && e.target.files[0]);
    });
    root.addEventListener("input", function (e) {
      if (/^p-/.test(e.target.name || "")) {
        var f = e.target.closest(".field"); if (f) f.classList.remove("is-invalid");
        clearError(); remember();
      }
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-copy]"); if (b) copy(b.getAttribute("data-copy"), b);
      if (e.target.closest("[data-retry-rate]")) loadRate(true);
    });
    var drop = $("[data-drop]", root);
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
    drop.addEventListener("drop", function (e) { takeFile(e.dataTransfer && e.dataTransfer.files[0]); });
  }

  function remember() {
    var r = st.root;
    store(PAYER_KEY, { tel: $("#p-tel", r).value, tipo: $("#p-ced-tipo", r).value, ced: $("#p-ced", r).value });
  }

  function takeFile(file) {
    if (!file) return;
    var ok = /^image\//.test(file.type) || file.type === "application/pdf" || /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name);
    if (!ok) return error("El comprobante debe ser una imagen (captura o foto) o un PDF.", $("[data-drop]", st.root));
    if (file.size > 8 * 1024 * 1024) return error("El archivo pesa más de 8 MB. Envía una captura de pantalla del comprobante.", $("[data-drop]", st.root));
    st.file = file;
    if (st.previewUrl) URL.revokeObjectURL(st.previewUrl);
    var drop = $("[data-drop]", st.root), img = $("[data-thumb]", st.root);
    var isImg = /^image\//.test(file.type) && !/hei[cf]/i.test(file.type);
    st.previewUrl = isImg ? URL.createObjectURL(file) : "";
    img.src = st.previewUrl || "";
    drop.classList.toggle("is-pdf", !isImg);
    drop.classList.add("has-file");
    $("[data-fname]", st.root).textContent = file.name;
    var f = drop.closest(".field"); if (f) f.classList.remove("is-invalid");
    clearError();
  }

  function paint() {
    var r = st.root; if (!r) return;
    var m = method(st.method);
    var d = st.delivery;
    var cj = st.cajas || { items: [], total: 0 };
    var total = st.subtotal + cj.total + (d && d.costo ? d.costo : 0);
    st.totalUsd = total;

    // Resumen
    var sum = '<div><span>Subtotal</span><b>' + usd(st.subtotal) + "</b></div>";
    cj.items.forEach(function (c) { sum += "<div><span>" + c.qty + " × " + esc(c.nombre) + "</span><b>" + usd(c.precio * c.qty) + "</b></div>"; });
    if (d) sum += '<div><span>Delivery · ' + esc(d.nombre) + "</span><b>" + (d.sinCosto ? "Por confirmar" : usd(d.costo || 0)) + "</b></div>";
    else if (st.entrega === "Delivery") sum += "<div><span>Entrega</span><b>Delivery · costo por configurar</b></div>";   // sin sectores cargados en config.js
    else sum += '<div><span>Entrega</span><b>Retiro en ' + esc(CFG.lugarRetiro || "el local") + "</b></div>";
    sum += '<div class="pay__total"><span>Total</span><b>' + usd(total) + "</b></div>";
    $("[data-p-sum]", r).innerHTML = sum;

    // Monto en bolívares
    var bsBox = $("[data-p-bs]", r);
    {
      if (st.rateState === "loading" || st.rateState === "idle") {
        bsBox.className = "pay__bs is-loading";
        bsBox.innerHTML = '<span class="pay__bs-label">Monto a pagar en bolívares</span><b class="pay__bs-amount">Calculando…</b><small>Consultando la tasa oficial del BCV</small>';
      } else if (st.rate) {
        var amount = total * st.rate.rate;
        bsBox.className = "pay__bs";
        bsBox.innerHTML = '<span class="pay__bs-label">Monto a pagar en bolívares</span>' +
          '<div class="pay__bs-row"><b class="pay__bs-amount">' + bs(amount) + "</b>" +
          '<button type="button" class="copy copy--lg" data-copy="' + bsPlain(amount) + '" aria-label="Copiar el monto en bolívares">' + COPY_SVG + "<span>Copiar</span></button></div>" +
          "<small>" + usd(total) + " × tasa BCV Bs. " + rateTxt(st.rate.rate) + (st.rate.date ? " (vigente desde el " + fmtDate(st.rate.date) + ")" : "") +
          (st.rateState === "stale" ? " · última tasa disponible" : "") + "</small>";
      } else {
        bsBox.className = "pay__bs is-error";
        bsBox.innerHTML = '<span class="pay__bs-label">Monto a pagar en bolívares</span><b class="pay__bs-amount">No disponible</b>' +
          '<small>No pudimos consultar la tasa del BCV para calcular el monto. Toca «Intentar de nuevo» en unos segundos.</small>' +
          '<button type="button" class="link-btn" data-retry-rate>Intentar de nuevo</button>';
      }
    }

    // Datos del local para pagar
    var acct = $("[data-p-acct]", r);
    {
      var a = account(m.id);
      acct.innerHTML = '<h4 class="acct__title">Datos para ' + (m.id === "pagoMovil" ? "el Pago móvil" : "la transferencia") + "</h4><dl>" +
        (m.id === "pagoMovil"
          ? rowHTML("Banco", a.banco, false) + rowHTML("Teléfono", a.telefono, true) + rowHTML("Cédula / RIF", a.cedula, true)
          : rowHTML("Banco", a.banco, false) + rowHTML("Titular", a.titular, false) + rowHTML("N.º de cuenta", a.cuenta, true) + rowHTML("Cédula / RIF", a.cedula, true)) +
        "</dl>";
    }
    $("[data-p-note]", r).textContent = (CFG.textos && CFG.textos.notaPago) || "Paga el monto exacto en bolívares, carga el comprobante y toca «Pedir por WhatsApp»: el pedido nos llega ya pagado.";
  }

  function error(msg, el) {
    var e = $("[data-p-error]", st.root); if (e) e.textContent = msg;
    if (el) {
      var f = el.closest(".field"); if (f) f.classList.add("is-invalid");
      if (el.focus) el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return false;
  }
  function clearError() { var e = $("[data-p-error]", st.root); if (e) e.textContent = ""; }

  /* ---------------- subir el comprobante ---------------- */
  function shrink(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || !window.createImageBitmap) return resolve(file);
      createImageBitmap(file).then(function (bmp) {
        var max = 1600, s = Math.min(1, max / Math.max(bmp.width, bmp.height));
        if (s === 1 && file.size < 1.5 * 1024 * 1024) return resolve(file);
        var c = document.createElement("canvas");
        c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(bmp, 0, 0, c.width, c.height);
        c.toBlob(function (b) { resolve(b ? new File([b], "comprobante.jpg", { type: "image/jpeg" }) : file); }, "image/jpeg", 0.85);
      }, function () { resolve(file); });
    });
  }
  function upload(file) {
    if (!/^https?:$/.test(location.protocol)) return Promise.resolve(null);
    return shrink(file).then(function (f) {
      var fd = new FormData();
      fd.append("restaurante", st.rest);
      fd.append("comprobante", f, f.name || "comprobante");
      return timeoutFetch(API + "comprobante.php", 30000, { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) { return j && j.ok && j.url ? j.url : null; });
    }).catch(function () { return null; });
  }

  /* ---------------- API pública ---------------- */
  window.SitePago = {
    usd: usd, bs: bs, bsNum: bsNum, rateTxt: rateTxt, fmtDate: fmtDate,
    hasSectors: hasSectors, sectorOptions: sectorOptions, sectorInfo: sectorInfo,
    loadRate: loadRate,
    rate: function () { return st.rate; },
    rateState: function () { return st.rateState; },
    onRate: function (fn) { listeners.push(fn); if (st.rateState !== "idle") fn(st.rate, st.rateState); },

    /* Muestra el paso de pago. opts: { root, subtotal, delivery: {nombre, zona, costo}|null, entrega } */
    enter: function (opts) {
      st.subtotal = opts.subtotal;
      st.delivery = opts.delivery;
      st.cajas = opts.cajas || null;
      st.entrega = opts.entrega || "Delivery";
      if (st.root !== opts.root) { st.root = opts.root; build(opts.root); }
      paint();
      if (st.rateState !== "ok") loadRate(false);
    },

    /* Valida el paso de pago. Devuelve false (y marca el error) o los datos del pago. */
    validate: function () {
      var r = st.root, m = method(st.method);
      clearError();
      var data = { id: m.id, metodo: m.label, totalUsd: st.totalUsd };
      if (!st.rate) return error("No pudimos consultar la tasa BCV para calcular el monto en bolívares. Toca «Intentar de nuevo».", $("[data-p-bs]", r));
      data.montoBs = bs(st.totalUsd * st.rate.rate); data.tasaTxt = rateTxt(st.rate.rate);
      var tel = $("#p-tel", r), ced = $("#p-ced", r), tipo = $("#p-ced-tipo", r);
      var telDigits = tel.value.replace(/\D/g, "");
      if (!/^(58)?0?4\d{9}$/.test(telDigits) && !/^0?2\d{9}$/.test(telDigits)) {
        return error("Escribe el teléfono desde el que hiciste el pago (ej. 0412-1234567).", tel);
      }
      var cedDigits = ced.value.replace(/\D/g, "");
      if (cedDigits.length < 5 || cedDigits.length > 10) return error("Escribe la cédula del titular del pago (solo números).", ced);
      if (!st.file) return error("Carga el comprobante del pago para poder enviar tu pedido.", $("[data-file]", r));
      var t = telDigits.replace(/^58/, "").replace(/^(?!0)/, "0");
      data.telefono = t.slice(0, 4) + "-" + t.slice(4);
      data.cedula = tipo.value + "-" + cedDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      data.file = st.file;
      return data;
    },

    upload: upload,
    canShareFile: function () {
      try { return !!(st.file && navigator.canShare && navigator.canShare({ files: [st.file] })); } catch (e) { return false; }
    },
    shareFile: function (text) {
      return navigator.share({ files: [st.file], text: text || "Comprobante de pago" }).catch(function () {});
    },
    reset: function () {
      st.file = null;
      if (st.previewUrl) URL.revokeObjectURL(st.previewUrl);
      st.previewUrl = "";
      if (st.root) {
        var drop = $("[data-drop]", st.root); if (drop) drop.classList.remove("has-file", "is-pdf");
        var inp = $("[data-file]", st.root); if (inp) inp.value = "";
      }
    }
  };
})();
