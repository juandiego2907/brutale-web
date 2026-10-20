/*
  Brutale Pizza · escribe las tarjetas del menú dentro de index.html.

    node tools/build_menu.js

  Lee js/config.js (productos, precios, envases) y reemplaza lo que está entre
  <!-- MENU:START --> y <!-- MENU:END --> (y entre <!-- ENVASES:START --> / <!-- ENVASES:END -->).
  Los precios también se pintan desde config.js al abrir la página, así que
  cambiar SOLO un precio no obliga a correr esto.
  (Versión en Node de tools/build_menu.py de la skill web-restaurante-pedidos: en este equipo no hay Python.)
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CONFIG = path.join(ROOT, "js", "config.js");
const INDEX = path.join(ROOT, "index.html");

/* config.js es JSON con comentarios // y /* *\/ y comas finales: se limpian y se lee como JSON. */
function readConfig() {
  const src = fs.readFileSync(CONFIG, "utf8");
  const body = src.slice(src.indexOf("{"), src.lastIndexOf("}") + 1);
  let out = "", inStr = false;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) {
      out += c;
      if (c === "\\") { out += body[++i]; }
      else if (c === '"') inStr = false;
    } else if (c === '"') { inStr = true; out += c; }
    else if (body.startsWith("//", i)) { while (i < body.length && body[i] !== "\n") i++; out += "\n"; }
    else if (body.startsWith("/*", i)) { i = body.indexOf("*/", i) + 1; }
    else out += c;
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"));
}

const money = (n) => "$" + n.toFixed(2).replace(".", ",");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICO_PLUS = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
const SIN_LLEVA = new Set(["postres", "bebidas"]);
const SIN_FOTO = new Set(["bebidas"]);   // las bebidas van en tarjeta compacta, sin foto
// Títulos de cada sección del menú (se ven en "Todo"; mismo texto que los filtros)
const SECCIONES = { autor: "Pizzas de Autor", clasicas: "Clásicas", calzone: "Calzone", postres: "Postres", bebidas: "Bebidas" };

function card(p, cfg) {
  const sizes = cfg.tamanos, short = cfg.medidas;
  const prices = p.precios;
  let first = prices.findIndex((v) => v !== null);
  const noPrice = first < 0;
  if (noPrice) first = 0;
  const tags = [p.grupo].concat(p.sinCarne ? ["sincarne"] : []);
  const custom = !p.unico && !noPrice;
  const o = [];
  const compact = SIN_FOTO.has(p.grupo);
  o.push(`<article class="pz rv${compact ? " pz--compact" : ""}${p.destacada ? " pz--star" : ""}" data-item data-id="${esc(p.id)}" data-name="${esc(p.nombre)}" data-tags="${tags.join(" ")}" data-size="${first}"${custom ? " data-custom" : ""}>`);
  if (!compact) {
    o.push('<div class="pz__art">');
    o.push(`<img class="pz__photo" src="${esc(p.img)}" alt="${esc(p.nombre)}" width="700" height="525" loading="lazy" decoding="async">`);
    if (p.destacada) o.push('<span class="pz__badge">La de la casa</span>');
    o.push(p.unico ? "" : `<span class="pz__cm" data-cm>${esc(short[first])}</span>`);
    o.push("</div>");
  }
  o.push('<div class="pz__body">');
  o.push(`<h3 class="pz__name">${esc(p.nombre)}</h3>`);
  if (p.chiste) o.push(`<p class="pz__joke">${esc(p.chiste)}</p>`);
  if (!SIN_LLEVA.has(p.grupo)) {
    const lleva = ["Salsa", "Mozzarella"].concat(p.lleva || []);
    o.push('<p class="pz__lleva"><span class="sr-only">Lleva: </span>' + lleva.map(esc).join(" · ") + "</p>");
  }
  if (p.unico || noPrice) {
    o.push(`<div class="sizes sizes--one" data-sizes><input type="radio" name="t-${esc(p.id)}" value="${first}" checked hidden></div>`);
  } else {
    o.push(`<fieldset class="sizes" data-sizes><legend class="sr-only">Tamaño de ${esc(p.nombre)}</legend>`);
    sizes.forEach((name, i) => {
      if (prices[i] === null) return;
      o.push(`<label title="${esc(name)}"><input type="radio" name="t-${esc(p.id)}" value="${i}"${i === first ? " checked" : ""}>` +
             `<span><b>${esc(short[i])}</b><i data-price>${money(prices[i])}</i></span></label>`);
    });
    o.push("</fieldset>");
    // Los adicionales se eligen DESPUÉS, en la hoja que abre "Añadir al carrito"
    o.push('<p class="pz__hint">Al añadirla eliges tus adicionales: ¿más queso? ¿más tocineta?</p>');
  }
  o.push('<div class="pz__foot"><p class="pz__price"><b data-add-total>' + (noPrice ? "Por confirmar" : money(prices[first])) + "</b>" +
         `<small data-add-bs>${noPrice ? "Precio por confirmar" : "Bs. calculando…"}</small></p>` +
         `<button type="button" class="btn btn--red btn--add" data-add${noPrice ? " disabled" : ""}>${ICO_PLUS}<span data-add-label>Añadir al carrito</span></button></div>`);
  o.push("</div></article>");
  return o.join("");
}

function envases(cfg) {
  return (cfg.envases || []).map(([n, p]) => `<li><span>${esc(n)}</span><b>${money(p)}</b></li>`).join("\n");
}

function replaceBlock(src, name, html) {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(src)) throw new Error(`No encontré <!-- ${name}:START --> / <!-- ${name}:END --> en index.html`);
  return src.replace(re, (m, a, b) => a + "\n" + html + "\n" + b);
}

const cfg = readConfig();
let src = fs.readFileSync(INDEX, "utf8");
// Antes del primer producto de cada grupo va el título de su sección (solo visible en "Todo")
let lastGroup = "";
const menuHTML = cfg.productos.map((p) => {
  let head = "";
  if (p.grupo !== lastGroup) {
    lastGroup = p.grupo;
    head = `<h3 class="menu__group" data-group-head data-tags="${esc(p.grupo)}"><span>${esc(SECCIONES[p.grupo] || p.grupo)}</span></h3>\n`;
  }
  return head + card(p, cfg);
}).join("\n");
src = replaceBlock(src, "MENU", menuHTML);
src = replaceBlock(src, "ENVASES", envases(cfg));
fs.writeFileSync(INDEX, src);
console.log(`OK · ${cfg.productos.length} productos y ${cfg.adicionales.length} adicionales escritos en index.html`);
