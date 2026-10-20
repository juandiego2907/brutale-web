/* =====================================================================
   Brutale Pizza · datos que cambian seguido
   Aquí se editan PRECIOS, pizzas, adicionales, WhatsApp, horario, delivery y datos de pago.

   Precios en dólares de referencia (REF.), siempre en este orden de tamaños:
     [ Individual, Familiar, Familiar con ½ kg de queso, XL ]
   null = ese tamaño no se ofrece (no aparece en la tarjeta) o el precio no está confirmado.
   Un producto con TODOS sus precios en null se ve en el menú, pero no se puede pedir.

   Los precios se leen de aquí cada vez que abre la página. Si cambias nombres,
   ingredientes o agregas un producto, corre después:  node tools/build_menu.js
   (vuelve a escribir las tarjetas dentro de index.html).
   ===================================================================== */
window.SITE_CONFIG = {
  "slug": "brutale",
  "nombre": "Brutale Pizza",
  "lugarRetiro": "",                     // PENDIENTE: dirección o referencia del local para retirar
  "colorFondo": "#121212", "colorTexto": "#FFFFFF",   // solo para la pestaña "Abriendo WhatsApp…"

  // Voz de la marca (urbana, con actitud). Copy creativo: el cliente debe aprobarlo.
  "textos": {
    "saludo": "¡Hola, *Brutale Pizza*! 🍕🔥",
    "intro": "Hice este pedido en la web y ya está *pagado*:",
    "cierre": "¡Que venga brutal! 🔥",
    "abriendo": "Encendiendo el horno…",
    "notaPago": "Paga el monto exacto en bolívares, carga el comprobante y toca «Pedir por WhatsApp»: tu pedido nos llega ya pagado.",
    "anadido": ["¡Brutal!", "¡Añadida!", "¡Buena elección!"],
    "unidad": ["producto", "productos"]
  },

  "whatsapp": "",                        // PENDIENTE: número que recibe los pedidos, p. ej. "584141234567" (sin +, sin espacios)
  "instagram": "brutalepizza",
  "moneda": "$",

  "tamanos": ["Individual", "Familiar", "Familiar con ½ kg de queso", "XL"],
  "medidas": ["IND.", "FAM.", "½ KG", "XL"],   // etiqueta corta de cada tamaño (como en la carta)

  // ¿Se pueden enviar pedidos con el local cerrado?
  // false = fuera de horario se puede ver el menú y armar el pedido, pero no pagarlo ni enviarlo.
  "pedidosFueraDeHorario": false,

  /* Hora de Caracas. Día 0 = domingo … 6 = sábado. null = cerrado ese día.
     PENDIENTE: el local no ha dado su horario. Mientras sea null, la web dice "Horario por confirmar"
     y deja hacer pedidos a cualquier hora. Ejemplo:
     "horario": { "0": { "abre": "17:00", "cierra": "23:00" }, "1": null, … } */
  "horario": null,

  /* ---------- DATOS PARA RECIBIR PAGOS ----------
     El cliente paga en la web (Pago móvil o Transferencia) y carga el comprobante:
     a WhatsApp llega el pedido completo YA PAGADO. Lo que quede "" se ve "Por configurar".
     telefono: como se escribe en Venezuela (0414-0000000) · cedula: V-12345678 o J-123456789 (RIF). */
  "pagos": {
    "pagoMovil":     { "banco": "", "telefono": "", "cedula": "" },
    "transferencia": { "banco": "", "titular": "", "cuenta": "", "cedula": "" }
  },

  /* ---------- DELIVERY POR SECTOR (Mérida) ----------
     Cada sector es [nombre, costo en dólares]. Escribe el costo como número (1.5 = $1,50).
     null = costo todavía sin cargar: en la web sale "por confirmar" y NO se suma al total que paga el cliente.
     PENDIENTE: cargar el costo de cada sector antes de publicar.
     Puedes añadir, quitar o renombrar sectores libremente. */
  "delivery": [
    { "zona": "Mérida · Centro", "sectores": [
      ["Centro (casco central)", null],
      ["Belén", null],
      ["El Llano", null],
      ["Milla", null],
      ["La Hoyada de Milla", null],
      ["Glorias Patrias", null],
      ["El Espejo", null],
      ["Pueblo Nuevo", null],
      ["Av. Tatuy", null],
      ["Av. Urdaneta", null],
      ["Av. 16 de Septiembre", null]
    ]},
    { "zona": "Mérida · Av. Las Américas", "sectores": [
      ["Av. Las Américas", null],
      ["Santa Juana", null],
      ["Pie del Llano", null],
      ["Campo de Oro", null],
      ["Urb. Humboldt", null],
      ["Santa Mónica", null],
      ["Santa Bárbara", null],
      ["Parque Albarregas", null]
    ]},
    { "zona": "Mérida · Norte", "sectores": [
      ["Santa María Norte", null],
      ["Santa María Sur", null],
      ["Av. Los Próceres", null],
      ["La Pedregosa Alta", null],
      ["La Pedregosa Media", null],
      ["La Pedregosa Sur", null],
      ["La Otra Banda", null],
      ["Andrés Eloy Blanco", null],
      ["Vega de La Isla", null],
      ["Pasaje La Isla", null],
      ["Santa Rosa", null],
      ["Los Chorros de Milla", null],
      ["La Hechicera", null],
      ["El Valle", null],
      ["La Culata", null]
    ]},
    { "zona": "Mérida · Sur", "sectores": [
      ["Av. Andrés Bello", null],
      ["Las Tapias", null],
      ["Alto Chama", null],
      ["El Chama", null],
      ["Chamita", null],
      ["San Jacinto", null],
      ["Belensate", null],
      ["La Parroquia", null],
      ["Los Curos", null],
      ["El Arenal", null]
    ]},
    { "zona": "Ejido (Campo Elías)", "sectores": [
      ["Ejido · Centro", null],
      ["El Manzano", null],
      ["Montalbán", null],
      ["La Mesa de Ejido", null],
      ["El Carrizal", null],
      ["Aguas Calientes", null]
    ]},
    { "zona": "Tabay (Santos Marquina)", "sectores": [
      ["Tabay · Centro", null],
      ["Mucunután", null],
      ["La Mucuy", null]
    ]}
  ],

  /* ---------- CAJAS EN DELIVERY ----------
     Con Delivery, cada pizza suma su caja según el tamaño (precios de la carta), en el orden de "tamanos":
     [ Individual, Familiar, Familiar ½ kg de queso, XL ]. Con Retiro no se cobran.
     Solo aplica a pizzas (calzone, postre y bebidas no llevan caja).
     PENDIENTE: confirmar que la XL y la de ½ kg van en caja familiar. */
  "cajasDelivery": [
    ["Caja individual", 0.9],
    ["Caja familiar", 1.6],
    ["Caja familiar", 1.6],
    ["Caja familiar", 1.6]
  ],

  /* ---------- LOS PRODUCTOS ----------
     grupo: "autor" | "clasicas" | "calzone" | "postres" | "bebidas"   ·   sinCarne: true para el filtro "Sin carne"
     lleva: ingredientes además de salsa y mozzarella (en pizzas y calzone)
     unico: true = tamaño único y sin adicionales (calzone, postre, bebidas): su precio va en la primera posición
     img: foto de la tarjeta (hoy fotos de stock: cambiar por fotos reales del local) */
  "productos": [
    { "id": "brutale",          "nombre": "Pizza Brutale",     "grupo": "autor",    "precios": [6.6, 17.85, 21.2, 44.1],    "lleva": ["Tomates en cuadrito", "Champiñones", "Jamón", "Pepperoni", "Tocineta", "Pecorino"], "chiste": "La de la casa. Todo lo bueno, encima.", "destacada": true, "img": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=70" },
    { "id": "sapore",           "nombre": "Pizza Sapore",      "grupo": "autor",    "precios": [5.1, 15.25, 18.55, 37.6],   "lleva": ["Tocineta", "Champiñones", "Cebolla caramelizada"], "chiste": "Dulce, salada y sin pedir permiso.", "img": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=70" },
    { "id": "toscana",          "nombre": "Pizza Toscana",     "grupo": "autor",    "precios": [5.75, 16.2, 20.1, 41.5],    "lleva": ["Pepperoni", "Champiñones", "Tocineta", "Maíz"], "chiste": "Un viaje a Italia con escala en tu mesa.", "img": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=70" },
    { "id": "maiale",           "nombre": "Pizza Maiale",      "grupo": "autor",    "precios": [6.5, 18.3, 21.2, 44.7],     "lleva": ["Salami", "Tocineta", "Aceitunas negras"], "chiste": "Para los carnívoros sin culpa.", "img": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=700&q=70" },
    { "id": "hongo-morron",     "nombre": "Hongo y Morrón",    "grupo": "autor",    "precios": [4.7, 13.75, 17.05, 33.8],   "lleva": ["Jamón", "Champiñones", "Pimentón"], "chiste": "El dúo que nunca falla.", "img": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=700&q=70" },
    { "id": "funghi-pancetta",  "nombre": "Funghi Pancetta",   "grupo": "autor",    "precios": [5.2, 15.35, 18.65, 37.9],   "lleva": ["Pimentón", "Cebolla", "Champiñones", "Tocineta", "Orégano"], "chiste": "Hongos, tocineta y cero arrepentimientos.", "img": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=70" },
    { "id": "vegetariana",      "nombre": "Pizza Vegetariana", "grupo": "autor",    "precios": [4.85, 14.6, 17.9, 35.9],    "lleva": ["Pimentón", "Cebolla", "Champiñones", "Maíz", "Orégano"], "sinCarne": true, "chiste": "Feroz también sin carne.", "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=70" },

    { "id": "margarita",        "nombre": "Pizza Margarita",   "grupo": "clasicas", "precios": [3.1, 9.65, 12.95, 23],      "lleva": ["Orégano"], "sinCarne": true, "chiste": "La clásica. Simple y brutal.", "img": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=70" },
    { "id": "tradicional",      "nombre": "Pizza Tradicional", "grupo": "clasicas", "precios": [3.64, 11.1, 14.4, 27.44],   "lleva": ["Jamón"], "chiste": "La que todos piden y nadie se arrepiente.", "img": "https://images.unsplash.com/photo-1595708684082-a173bb3a06c5?auto=format&fit=crop&w=700&q=70" },
    { "id": "tocineta",         "nombre": "Pizza Tocineta",    "grupo": "clasicas", "precios": [4.1, 12.2, 15.5, 30.15],    "lleva": ["Tocineta"], "chiste": "Crujiente, como tiene que ser.", "img": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=700&q=70" },
    { "id": "champinon",        "nombre": "Pizza Champiñón",   "grupo": "clasicas", "precios": [3.85, 11.55, 14.84, 28.44], "lleva": ["Champiñones", "Orégano"], "sinCarne": true, "chiste": "Champiñones de verdad, en cantidad.", "img": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=700&q=70" },
    { "id": "salami",           "nombre": "Pizza Salami",      "grupo": "clasicas", "precios": [4.95, 12.9, 16.18, 31.8],   "lleva": ["Salami"], "chiste": "Rueditas de puro sabor.", "img": "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=700&q=70" },
    { "id": "napolitana",       "nombre": "Pizza Napolitana",  "grupo": "clasicas", "precios": [3.8, 11.55, 14.85, 28.45],  "lleva": ["Anchoas", "Orégano"], "chiste": "Para los que saben lo que quieren.", "img": "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=700&q=70" },
    { "id": "pepperoni",        "nombre": "Pizza Pepperoni",   "grupo": "clasicas", "precios": [3.95, 11.8, 15.1, 29],      "lleva": ["Pepperoni"], "chiste": "La favorita de la manada.", "img": "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=70" },
    { "id": "hawaiana",         "nombre": "Pizza Hawaiana",    "grupo": "clasicas", "precios": [4.4, 12.8, 16.1, 31.55],    "lleva": ["Piña", "Jamón o tocineta"], "chiste": "Sí, lleva piña. Dinos si la quieres con jamón o con tocineta.", "img": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=70" },

    { "id": "calzone",          "nombre": "Calzone",           "grupo": "calzone",  "precios": [6.75, null, null, null],    "unico": true, "lleva": ["Jamón", "Tocineta", "Pimentón", "Cebolla", "Champiñones"], "chiste": "Una pizza cerrada que guarda todo adentro.", "img": "https://images.unsplash.com/photo-1536964549204-cce9eab227bd?auto=format&fit=crop&w=700&q=70" },

    { "id": "postre",           "nombre": "Postre",            "grupo": "postres",  "precios": [2.3, null, null, null],     "unico": true, "chiste": "Para cerrar con broche dulce. Pregunta por el del día.", "img": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=70" },

    { "id": "refresco-botella", "nombre": "Refresco de botella", "grupo": "bebidas", "precios": [1.1, null, null, null],   "unico": true, "chiste": "Bien frío." },
    { "id": "refresco-15",      "nombre": "Refresco 1,5 L",    "grupo": "bebidas",  "precios": [3.6, null, null, null],     "unico": true, "chiste": "Para acompañar la familiar." },
    { "id": "refresco-2",       "nombre": "Refresco 2 L",      "grupo": "bebidas",  "precios": [null, null, null, null],    "unico": true, "chiste": "Para la manada completa." },
    { "id": "nestea",           "nombre": "Nestea",            "grupo": "bebidas",  "precios": [1.5, null, null, null],     "unico": true, "chiste": "Té frío." },
    { "id": "yukery",           "nombre": "Yukery",            "grupo": "bebidas",  "precios": [null, null, null, null],    "unico": true, "chiste": "Jugo." },
    { "id": "agua",             "nombre": "Agua mineral",      "grupo": "bebidas",  "precios": [1.5, null, null, null],     "unico": true, "chiste": "Siempre fría." }
  ],

  /* ---------- ADICIONALES (solo pizzas) ----------
     Se suman a la pizza según su tamaño: [ Individual, Familiar, Familiar ½ kg de queso, XL ].
     La carta trae tres columnas (IND., FAM., XL): para "Familiar con ½ kg de queso" se usa el precio
     de la familiar. PENDIENTE: que el local confirme ese criterio. */
  "adicionales": [
    { "id": "queso",       "nombre": "Queso",                "precios": [1.7, 5.05, 5.05, 12.95] },
    { "id": "vegetales",   "nombre": "Vegetales",            "precios": [1.15, 2.25, 2.25, 4] },
    { "id": "maiz",        "nombre": "Maíz",                 "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "champinones", "nombre": "Champiñones",          "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "pina",        "nombre": "Piña",                 "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "cebolla-car", "nombre": "Cebolla caramelizada", "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "aceitunas",   "nombre": "Aceitunas negras",     "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "anchoas",     "nombre": "Anchoas",              "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "jamon",       "nombre": "Jamón",                "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "tocineta",    "nombre": "Tocineta",             "precios": [1.7, 3.95, 3.95, 12.35] },
    { "id": "pepperoni",   "nombre": "Pepperoni",            "precios": [1.35, 2.8, 2.8, 11.2] },
    { "id": "salami",      "nombre": "Salami",               "precios": [2.15, 4.15, 4.15, 12.6] },
    { "id": "pecorino",    "nombre": "Pecorino",             "precios": [1.15, 2.25, 2.25, 6.2] },
    { "id": "salsa",       "nombre": "Salsa",                "precios": [1.15, 2.5, 2.5, 6.2] }
  ],

  /* ---------- ENVASES (lista que se muestra en el menú) ----------
     Las cajas se cobran solas en Delivery (ver "cajasDelivery"). Los platos de anime solo se muestran. */
  "envases": [
    ["Caja familiar", 1.6],
    ["Caja individual", 0.9],
    ["Platos de anime", 0.3]
  ]
};
