# Brutale Pizza · web con pedidos pagados por WhatsApp

Landing de Brutale Pizza con menú, carrito y pago en la web. El cliente arma su pedido, paga
por Pago móvil o Transferencia, carga el comprobante y el pedido llega al local **ya pagado**
por WhatsApp. Hecha con la skill `web-restaurante-pedidos` de KEHO.

## Qué cambiar y dónde

| Quiero cambiar… | Archivo |
|---|---|
| Precios, pizzas, bebidas, adicionales | `js/config.js` → `productos`, `adicionales` |
| Número de WhatsApp que recibe los pedidos | `js/config.js` → `whatsapp` (ej. `"584141234567"`) |
| Datos de Pago móvil / Transferencia | `js/config.js` → `pagos` |
| Horario (hora de Caracas) | `js/config.js` → `horario` |
| Zonas de delivery y su costo | `js/config.js` → `delivery` |
| Lugar de retiro | `js/config.js` → `lugarRetiro` |
| Textos del mensaje de WhatsApp | `js/config.js` → `textos` |
| Colores, tipografías, diseño | `css/styles.css` (marca) · `css/carrito.css` (carrito, hoja, pago) |
| Textos de las secciones | `index.html` |

Si solo cambias un **precio**, basta con editar `js/config.js`. Si cambias **nombres, ingredientes o
agregas/quitas productos**, después corre:

```bash
node tools/build_menu.js
```

(vuelve a escribir las tarjetas del menú dentro de `index.html`).

Al subir cambios de CSS o JS, cambia el `?v=20261017` de `index.html` para que los navegadores no usen la versión vieja.

## Cómo funciona el pedido

1. **Menú**: cada pizza tiene 4 tamaños (IND., FAM., ½ KG de queso, XL). Precio en $ y su equivalente en Bs.
   con la tasa oficial del BCV vigente (se consulta al abrir la página).
2. **Adicionales**: al tocar "Añadir al carrito" en una pizza se abre una hoja con los adicionales
   al precio de ese tamaño, una nota y la cantidad. Calzone, postre y bebidas se añaden directo.
3. **Tu pedido**: nombre, Delivery (dirección y sector si hay sectores cargados) o Retiro.
4. **Pago**: Pago móvil o Transferencia. Monto exacto en bolívares (redondeado hacia arriba), datos del
   local con botón Copiar, teléfono y cédula de quien pagó y **comprobante obligatorio**.
5. **WhatsApp**: se abre con el pedido completo y pagado. Es el único enlace a WhatsApp de toda la web.

Fuera de horario se puede armar el pedido, pero no pagarlo ni enviarlo (`pedidosFueraDeHorario: false`).

## Publicar (Hostinger)

- Subir todo **menos** `fotos y videos/` y `tools/`.
- `api/` necesita PHP: guarda los comprobantes en una carpeta privada (se borran a los 60 días) y es el respaldo de la tasa BCV.
- Sin servidor PHP (abriendo el archivo con doble clic) la web funciona igual, pero el mensaje dice
  "el comprobante lo adjunto en este chat".
- `og:image` usa una ruta relativa: al tener el dominio, cámbiala por la URL completa (`https://dominio/assets/og.jpg`).

## Archivos

```
index.html        contenido (las tarjetas del menú las escribe tools/build_menu.js)
css/styles.css    identidad de Brutale
css/carrito.css   carrito, hoja de adicionales y pago
js/config.js      datos del negocio
js/pago.js        tasa BCV + paso de pago
js/main.js        tarjetas, hoja, carrito, mensaje, horario, filtros
api/              PHP: tasa-bcv, comprobante, ver-comprobante
assets/           logo recortado, favicon, og.jpg
tools/            build_menu.js
```

Los recursos de `assets/` (logo recortado en círculo, favicon, `og.jpg`) se generaron desde
`fotos y videos/Gemini_Generated_Image_i57g1ri57g1ri57g.jpg`.

## Pendiente del cliente

Sin esto la web **no puede recibir pedidos reales**:

- [ ] **WhatsApp** que recibe los pedidos (`whatsapp`). Hoy está vacío: al pagar sale el aviso "Falta configurar el WhatsApp".
- [ ] **Datos de Pago móvil y Transferencia** (banco, teléfono, cédula/RIF, cuenta, titular). Hoy dicen "Por configurar".
- [ ] **Horario** de atención. Hoy la web dice "Horario por confirmar" y acepta pedidos a cualquier hora.
- [ ] **Zonas de delivery y su costo**. Hoy el delivery **no se suma** al total que paga el cliente.
- [ ] **Dirección del local** (sección Visítanos y `lugarRetiro`).

Por confirmar con el local:

- [ ] Precio del **Refresco 2 L** y del **Yukery**: en la foto del menú no se leen. Hoy aparecen "por confirmar" y no se pueden pedir.
- [ ] Precios de bebidas: Nestea $1,50 y Agua mineral $1,50 se leyeron de la foto. Conviene revisarlos.
- [ ] **Adicionales en la pizza de ½ kg de queso**: la carta solo tiene columnas IND., FAM. y XL; se usa el precio FAM.
- [ ] **Envases** (caja familiar $1,60, caja individual $0,90, platos $0,30): ¿se cobran en cada pedido? Hoy solo se muestran y no se suman.
- [ ] **Postre**: la carta dice "Postre $2,30" sin nombre ni sabor.
- [ ] **Fotos**: las de los productos y el hero son de stock (Unsplash). Reemplazar por fotos reales del local.
- [ ] **Frases de la marca** (los textos cortos de cada pizza, el mensaje de WhatsApp): son copy creativo, aprobarlas.
- [ ] Los textos de "Ingredientes frescos / Masa artesanal / Entrega rápida" describen el negocio: confirmar que son ciertos.
