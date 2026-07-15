const WHATSAPP_NUMBER = "50767604522";
const WHATSAPP_ICON = "assets/icons/whatsapp-icon.png";
const PRODUCTS_ENDPOINT = "data/productos.json";
const PRODUCT_CATEGORY_MEDIA = {
  rectangular: {
    src: "assets/img/catalogo/sellos-rectangulares-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello automatico rectangular"
  },
  cuadrado: {
    src: "assets/img/catalogo/sellos-cuadrados-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello automatico cuadrado"
  },
  ovalado: {
    src: "assets/img/catalogo/sellos-ovalados-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello automatico ovalado"
  },
  flash: {
    src: "assets/img/catalogo/sellos-flash-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sellos flash profesionales"
  },
  fidelizacion: {
    src: "assets/img/catalogo/sellos-fidelizacion-premium.png",
    width: 1448,
    height: 1086,
    alt: "Imagen de referencia de sello para tarjetas de fidelizacion"
  },
  redondoShiny: {
    src: "assets/img/catalogo/sello-redondo-shiny-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello automatico redondo Shiny"
  },
  flashRedondo: {
    src: "assets/img/catalogo/flash-redondo-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello flash redondo"
  },
  flashAzul: {
    src: "assets/img/catalogo/flash-azul-premium.png",
    width: 1254,
    height: 1254,
    alt: "Imagen de referencia de sello flash azul"
  },
  pocket: {
    src: "assets/img/catalogo/pocket-stamp-premium.png",
    width: 1402,
    height: 1122,
    alt: "Imagen de referencia de sello Pocket Stamp portatil"
  },
  redondo: {
    src: "assets/img/categorias/sellos-redondos-premium.png",
    width: 1448,
    height: 1086,
    alt: "Imagen de referencia de sellos redondos profesionales"
  },
  tinta: {
    src: "assets/img/catalogo/tintas-premium.png",
    width: 1448,
    height: 1086,
    alt: "Imagen de referencia de tintas y accesorios para sellos"
  }
};

document.documentElement.classList.add("js");

// Estado compartido del catalogo.
let productosOriginales = [];
let categoriaActiva = "Todos";
let busquedaActual = "";

document.addEventListener("DOMContentLoaded", () => {
  prepararNavegacion();
  prepararRevelado();
  prepararLinksGenerales();
  prepararLinksPapeleria();
  prepararWhatsAppVisual();
  prepararCatalogo();
  prepararFormularioContacto();
});

// Carga los productos desde el JSON para funcionar en GitHub Pages.
async function cargarProductos() {
  try {
    const respuesta = await fetch(PRODUCTS_ENDPOINT, { cache: "no-store" });

    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status}`);
    }

    return await respuesta.json();
  } catch (error) {
    mostrarMensajeCatalogo(
      "No se pudo cargar data/productos.json. Si abriste este archivo directamente, usa Live Server o un servidor local para probar el catalogo."
    );
    actualizarTotalProductos(0);
    return [];
  }
}

// Pinta las tarjetas del catalogo con DOM APIs para evitar HTML inyectado.
function renderProductos(productos) {
  const contenedor = document.querySelector("[data-productos]");
  if (!contenedor) return;

  contenedor.innerHTML = "";
  ocultarMensajeCatalogo();
  actualizarTotalProductos(productos.length);

  if (!productos.length) {
    mostrarMensajeCatalogo("No encontramos productos con esos filtros. Prueba con otra categoria o busqueda.");
    return;
  }

  const fragmento = document.createDocumentFragment();
  productos.forEach((producto) => fragmento.appendChild(crearTarjetaProducto(producto)));
  contenedor.appendChild(fragmento);
}

// Los filtros principales usan categoria exacta; Redondo cruza forma y nombre.
function filtrarProductos(productos, categoria) {
  if (!categoria || normalizarTexto(categoria) === "todos") {
    return productos;
  }

  const filtro = normalizarTexto(categoria);

  if (filtro !== "redondo") {
    return productos.filter((producto) => normalizarTexto(producto.categoria) === filtro);
  }

  return productos.filter((producto) => {
    const camposCategoria = [
      producto.forma,
      producto.nombre,
      producto.palabras_clave
    ];

    return camposCategoria.some((campo) => normalizarTexto(campo).includes(filtro));
  });
}

// Busca en los campos comerciales mas utiles para el cliente.
function buscarProductos(productos, termino) {
  const busqueda = normalizarTexto(termino);
  if (!busqueda) return productos;

  return productos.filter((producto) => {
    const camposBusqueda = [
      producto.nombre,
      producto.modelo,
      producto.tamano,
      producto.palabras_clave,
      producto.sku
    ];

    return camposBusqueda.some((campo) => normalizarTexto(campo).includes(busqueda));
  });
}

// Centraliza el enlace para cambiar el numero una sola vez.
function crearLinkWhatsApp(productoOMensaje) {
  const mensaje = typeof productoOMensaje === "string"
    ? productoOMensaje
    : `Hola, estoy interesado en cotizar el producto ${productoOMensaje.nombre || "seleccionado"} de Sellos Isaac.`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}

async function prepararCatalogo() {
  const contenedor = document.querySelector("[data-productos]");
  if (!contenedor) return;

  const parametros = new URLSearchParams(window.location.search);
  const categoriaInicial = parametros.get("categoria");

  if (categoriaInicial) {
    categoriaActiva = categoriaInicial;
    activarBotonFiltro(categoriaInicial);
  }

  productosOriginales = await cargarProductos();
  aplicarFiltros();
  prepararEventosCatalogo();
}

function prepararEventosCatalogo() {
  const buscador = document.querySelector("[data-buscador]");
  const filtros = document.querySelectorAll("[data-filtro]");

  if (buscador) {
    buscador.addEventListener("input", (evento) => {
      busquedaActual = evento.target.value;
      aplicarFiltros();
    });
  }

  filtros.forEach((boton) => {
    boton.addEventListener("click", () => {
      categoriaActiva = boton.dataset.filtro;
      activarBotonFiltro(categoriaActiva);
      aplicarFiltros();
    });
  });
}

function aplicarFiltros() {
  const porCategoria = filtrarProductos(productosOriginales, categoriaActiva);
  const resultado = buscarProductos(porCategoria, busquedaActual);
  renderProductos(resultado);
}

function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "product-card";

  const media = crearMediaProducto(producto);
  const cuerpo = document.createElement("div");
  cuerpo.className = "product-body";

  const categoria = document.createElement("span");
  categoria.className = "product-category";
  categoria.textContent = producto.categoria || "Producto";

  const titulo = document.createElement("h3");
  titulo.className = "product-title";
  titulo.textContent = producto.nombre || "Producto sin nombre";

  const modelo = document.createElement("span");
  modelo.className = "product-model";
  modelo.textContent = producto.modelo ? `Modelo ${producto.modelo}` : "Modelo por confirmar";

  const precio = document.createElement("span");
  precio.className = "product-price";
  precio.textContent = formatearPrecio(producto);

  const detalles = document.createElement("dl");
  detalles.className = "product-details";
  detalles.appendChild(crearDetalle("Categoria", producto.categoria || "N/A"));
  detalles.appendChild(crearDetalle("Tamano", producto.tamano || "N/A"));
  detalles.appendChild(crearDetalle("Stock", producto.stock || "Consultar"));

  const enlace = document.createElement("a");
  enlace.className = "btn btn-whatsapp with-whatsapp-icon";
  enlace.href = crearLinkWhatsApp(producto);
  enlace.target = "_blank";
  enlace.rel = "noopener";
  enlace.append(crearIconoWhatsApp(), document.createTextNode("Cotizar por WhatsApp"));

  cuerpo.append(categoria, titulo, modelo, precio, detalles, enlace);
  if (media) {
    tarjeta.appendChild(media);
  }
  tarjeta.appendChild(cuerpo);

  return tarjeta;
}

function crearMediaProducto(producto) {
  const media = document.createElement("div");
  media.className = "product-media";
  const imagen = document.createElement("img");
  const usaFallback = !producto.url_foto;
  const fallback = obtenerMediaCategoria(producto);

  imagen.src = usaFallback ? fallback.src : producto.url_foto;
  imagen.alt = usaFallback ? fallback.alt : producto.nombre || "Producto de Sellos Isaac";
  imagen.loading = "lazy";
  imagen.decoding = "async";

  if (usaFallback) {
    media.classList.add("product-media-fallback");
    imagen.width = fallback.width;
    imagen.height = fallback.height;
    media.appendChild(crearEtiquetaMediaReferencia());
  }

  imagen.addEventListener("error", () => {
    if (media.classList.contains("product-media-fallback")) {
      media.remove();
      return;
    }

    media.classList.add("product-media-fallback");
    imagen.src = fallback.src;
    imagen.alt = fallback.alt;
    imagen.width = fallback.width;
    imagen.height = fallback.height;
    media.appendChild(crearEtiquetaMediaReferencia());
  }, { once: true });

  media.prepend(imagen);
  return media;
}

function obtenerMediaCategoria(producto) {
  const categoria = normalizarTexto(producto.categoria);
  const forma = normalizarTexto(producto.forma);
  const contexto = normalizarTexto([
    producto.categoria,
    producto.forma,
    producto.subcategoria,
    producto.nombre,
    producto.palabras_clave
  ].filter(Boolean).join(" "));

  if (categoria === "tinta") {
    return PRODUCT_CATEGORY_MEDIA.tinta;
  }

  if (categoria === "pocket" || contexto.includes("pocket")) {
    return PRODUCT_CATEGORY_MEDIA.pocket;
  }

  if (contexto.includes("fidelizacion")) {
    return PRODUCT_CATEGORY_MEDIA.fidelizacion;
  }

  if (categoria === "flash" && (forma.includes("redond") || contexto.includes("round"))) {
    return PRODUCT_CATEGORY_MEDIA.flashRedondo;
  }

  if (categoria === "flash" && (contexto.includes("azul") || contexto.includes("blue"))) {
    return PRODUCT_CATEGORY_MEDIA.flashAzul;
  }

  if (categoria === "flash") {
    return PRODUCT_CATEGORY_MEDIA.flash;
  }

  if (forma.includes("oval")) {
    return PRODUCT_CATEGORY_MEDIA.ovalado;
  }

  if (forma.includes("cuadrad")) {
    return PRODUCT_CATEGORY_MEDIA.cuadrado;
  }

  if (forma.includes("redond") || forma.includes("circular")) {
    return contexto.includes("shiny")
      ? PRODUCT_CATEGORY_MEDIA.redondoShiny
      : PRODUCT_CATEGORY_MEDIA.redondo;
  }

  if (contexto.includes("oval")) return PRODUCT_CATEGORY_MEDIA.ovalado;
  if (contexto.includes("cuadrad")) return PRODUCT_CATEGORY_MEDIA.cuadrado;
  if (contexto.includes("redondo") || contexto.includes("circular")) return PRODUCT_CATEGORY_MEDIA.redondo;

  if (contexto.includes("tinta") || contexto.includes("almohadilla")) {
    return PRODUCT_CATEGORY_MEDIA.tinta;
  }

  return PRODUCT_CATEGORY_MEDIA.rectangular;
}

function crearEtiquetaMediaReferencia() {
  const etiqueta = document.createElement("span");
  etiqueta.className = "product-media-note";
  etiqueta.textContent = "Imagen de referencia";
  return etiqueta;
}

function crearIconoWhatsApp(claseAdicional = "") {
  const icono = document.createElement("img");
  icono.className = `whatsapp-icon ${claseAdicional}`.trim();
  icono.src = WHATSAPP_ICON;
  icono.width = 20;
  icono.height = 20;
  icono.alt = "";
  icono.setAttribute("aria-hidden", "true");
  icono.decoding = "async";
  return icono;
}

function agregarIconoWhatsApp(elemento) {
  if (!elemento || elemento.querySelector(".whatsapp-icon")) return;
  elemento.classList.add("with-whatsapp-icon");
  elemento.prepend(crearIconoWhatsApp());
}

function prepararWhatsAppVisual() {
  const puntosContacto = document.querySelectorAll([
    "[data-whatsapp-general]",
    "[data-whatsapp-service]",
    ".footer-contact a[href*='wa.me/']",
    "[data-contact-form] button[type='submit']"
  ].join(","));

  puntosContacto.forEach(agregarIconoWhatsApp);

  if (document.querySelector(".whatsapp-float")) return;

  const flotante = document.createElement("a");
  flotante.className = "whatsapp-float";
  flotante.href = crearLinkWhatsApp("Hola, quiero cotizar con Sellos Isaac.");
  flotante.target = "_blank";
  flotante.rel = "noopener";
  flotante.setAttribute("aria-label", "Contactar por WhatsApp");
  flotante.appendChild(crearIconoWhatsApp("whatsapp-float-icon"));
  document.body.appendChild(flotante);
}

function crearDetalle(etiqueta, valor) {
  const fila = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");

  dt.textContent = etiqueta;
  dd.textContent = valor;
  fila.append(dt, dd);

  return fila;
}

function formatearPrecio(producto) {
  if (producto.mostrar_precio === false || producto.precio === null || producto.precio === undefined || producto.precio === "") {
    return "Consultar";
  }

  const precio = Number(producto.precio);
  return Number.isFinite(precio) ? `$${precio.toFixed(2)}` : "Consultar";
}

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function activarBotonFiltro(categoria) {
  const filtros = document.querySelectorAll("[data-filtro]");
  const categoriaNormalizada = normalizarTexto(categoria);

  filtros.forEach((boton) => {
    const coincide = normalizarTexto(boton.dataset.filtro) === categoriaNormalizada;
    boton.classList.toggle("active", coincide);
  });
}

function mostrarMensajeCatalogo(mensaje) {
  const mensajeCatalogo = document.querySelector("[data-catalogo-mensaje]");
  const contenedor = document.querySelector("[data-productos]");

  if (!mensajeCatalogo) return;
  if (contenedor) contenedor.innerHTML = "";

  mensajeCatalogo.textContent = mensaje;
  mensajeCatalogo.hidden = false;
}

function ocultarMensajeCatalogo() {
  const mensajeCatalogo = document.querySelector("[data-catalogo-mensaje]");
  if (mensajeCatalogo) mensajeCatalogo.hidden = true;
}

function actualizarTotalProductos(total) {
  const totalProductos = document.querySelector("[data-total-productos]");
  if (!totalProductos) return;

  totalProductos.textContent = total === 1
    ? "1 producto encontrado"
    : `${total} productos encontrados`;
}

function prepararLinksGenerales() {
  const links = document.querySelectorAll("[data-whatsapp-general]");
  const mensaje = "Hola, quiero cotizar un sello personalizado de Sellos Isaac.";

  links.forEach((link) => {
    link.href = crearLinkWhatsApp(mensaje);
    link.target = "_blank";
    link.rel = "noopener";
  });
}

function prepararNavegacion() {
  const encabezado = document.querySelector(".site-header");
  const boton = document.querySelector(".nav-toggle");
  const navegacion = document.querySelector(".main-nav");
  if (!encabezado || !boton || !navegacion) return;

  const cerrarMenu = () => {
    encabezado.classList.remove("nav-open");
    boton.setAttribute("aria-expanded", "false");
    boton.setAttribute("aria-label", "Abrir menu");
  };

  boton.addEventListener("click", () => {
    const abierto = encabezado.classList.toggle("nav-open");
    boton.setAttribute("aria-expanded", String(abierto));
    boton.setAttribute("aria-label", abierto ? "Cerrar menu" : "Abrir menu");
  });

  navegacion.addEventListener("click", (evento) => {
    if (evento.target.closest("a")) cerrarMenu();
  });

  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrarMenu();
  });
}

function prepararRevelado() {
  const elementos = document.querySelectorAll("[data-reveal]");
  if (!elementos.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elementos.forEach((elemento) => elemento.classList.add("is-visible"));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add("is-visible");
      observador.unobserve(entrada.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

  elementos.forEach((elemento) => observador.observe(elemento));
}

function prepararLinksPapeleria() {
  const links = document.querySelectorAll("[data-whatsapp-service]");

  links.forEach((link) => {
    const servicio = link.dataset.whatsappService || "papeleria";
    const mensaje = `Hola, quiero cotizar ${servicio} con Sellos Isaac.`;

    link.href = crearLinkWhatsApp(mensaje);
    link.target = "_blank";
    link.rel = "noopener";
  });
}

function prepararFormularioContacto() {
  const formulario = document.querySelector("[data-contact-form]");
  if (!formulario) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const datos = new FormData(formulario);
    const nombre = datos.get("nombre") || "";
    const telefono = datos.get("telefono") || "";
    const tipo = datos.get("tipo") || "";
    const mensaje = datos.get("mensaje") || "";

    const textoWhatsApp = [
      `Hola, soy ${nombre}.`,
      `Quiero cotizar un producto o servicio tipo ${tipo}.`,
      `Mi telefono es ${telefono}.`,
      mensaje ? `Mensaje: ${mensaje}` : ""
    ].filter(Boolean).join(" ");

    window.open(crearLinkWhatsApp(textoWhatsApp), "_blank", "noopener");
  });
}
