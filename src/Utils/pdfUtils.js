import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPetlove from '../assets/logo.png';

// Configuración de la empresa
const EMPRESA_CONFIG = {
  nombre: 'PET LOVE',
  slogan: 'Tu mascota, nuestra pasión',
  nit: '901.234.567-8',
  telefono: '(604) 123-4567',
  celular: '310 123 4567',
  direccion: 'Calle 123 # 45-67',
  ciudad: 'Bello, Antioquia',
  email: 'info@petlove.com',
  web: 'www.petlove.com',
  regimen: 'Régimen Simplificado',
  actividad: 'Comercialización de productos para mascotas'
};

// Colores corporativos mejorados
const COLORES = {
  primario: [255, 255, 255],
  secundario: [255, 255, 255],
  acento: [255, 255, 255],
  texto: [0, 0, 0],
  textoSecundario: [0, 0, 0],
  textoClaro: [0, 0, 0],
  fondo: [255, 255, 255],
  fondoClaro: [255, 255, 255],
  exito: [0, 0, 0],
  advertencia: [0, 0, 0],
  error: [0, 0, 0],
  blanco: [255, 255, 255],
  gris: [0, 0, 0]
};

/**
 * Crea el encabezado estándar mejorado para todos los PDFs
 * @param {jsPDF} doc - Instancia del documento PDF
 * @param {string} titulo - Título del reporte
 * @param {string} subtitulo - Subtítulo opcional
 * @param {string} tipoDocumento - Tipo de documento (FACTURA, ORDEN, REPORTE, etc.)
 */
export const crearEncabezado = (doc, titulo, subtitulo = '', tipoDocumento = 'DOCUMENTO') => {
  // Fondo degradado del encabezado (desactivado: blanco)
  doc.setFillColor(...COLORES.primario);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Banda superior decorativa (desactivada: blanco)
  doc.setFillColor(...COLORES.secundario);
  doc.rect(0, 0, 210, 8, 'F');
  
  // Logo con marco
  try {
    doc.addImage(logoPetlove, 'PNG', 15, 12, 30, 30);
    // Marco del logo
    doc.setDrawColor(...COLORES.gris);
    doc.setLineWidth(0.5);
    doc.rect(15, 12, 30, 30);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
    // Placeholder del logo
    doc.setFillColor(...COLORES.blanco);
    doc.rect(15, 12, 30, 30, 'F');
    doc.setDrawColor(...COLORES.gris);
    doc.rect(15, 12, 30, 30);
    doc.setTextColor(...COLORES.texto);
    doc.setFontSize(8);
    doc.text('LOGO', 30, 28, { align: 'center' });
  }
  
  // Información de la empresa - Sección principal
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(EMPRESA_CONFIG.nombre, 50, 20);
  
  // Slogan
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...COLORES.texto);
  doc.text(EMPRESA_CONFIG.slogan, 50, 26);
  
  // Información de contacto - Columna izquierda
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORES.texto);
  doc.text(`NIT: ${EMPRESA_CONFIG.nit}`, 50, 32);
  doc.text(`${EMPRESA_CONFIG.regimen}`, 50, 36);
  doc.text(`Tel: ${EMPRESA_CONFIG.telefono} | Cel: ${EMPRESA_CONFIG.celular}`, 50, 40);
  
  // Información de ubicación - Columna derecha
  doc.text(`${EMPRESA_CONFIG.direccion}`, 130, 32);
  doc.text(`${EMPRESA_CONFIG.ciudad}`, 130, 36);
  doc.text(`${EMPRESA_CONFIG.email} | ${EMPRESA_CONFIG.web}`, 130, 40);
  
  // Tipo de documento en esquina superior derecha (sin fondo)
  doc.setFillColor(...COLORES.acento);
  doc.rect(160, 12, 35, 12, 'F');
  doc.setTextColor(...COLORES.texto);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(tipoDocumento, 177.5, 19, { align: 'center' });
  
  // Línea separadora
  doc.setDrawColor(...COLORES.gris);
  doc.setLineWidth(0.5);
  doc.line(15, 52, 195, 52);
  
  // Título del reporte
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORES.texto);
  doc.text(titulo, 15, 62);
  
  if (subtitulo) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.texto);
    doc.text(subtitulo, 15, 70);
  }
  
  // Fecha y hora de generación con formato mejorado
  const ahora = new Date();
  const formatoFecha = ahora.toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const formatoHora = ahora.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORES.texto);
  doc.text(`Generado: ${formatoFecha} ${formatoHora}`, 195, 62, { align: 'right' });
  
  return 75; // Devuelve la posición Y de inicio del contenido
};

/**
 * Crea el pie de página estándar mejorado
 * @param {jsPDF} doc - Instancia del documento PDF
 * @param {Object} opciones - Opciones adicionales para el pie de página
 */
export const crearPiePagina = (doc, opciones = {}) => {
  const pageCount = doc.internal.getNumberOfPages();
  const {
    mostrarTerminos = true,
    mostrarContacto = true,
    textoPersonalizado = null
  } = opciones;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Línea superior del pie
    doc.setDrawColor(...COLORES.gris);
    doc.setLineWidth(0.3);
    doc.line(15, 275, 195, 275);
    
    // Fondo del pie (blanco)
    doc.setFillColor(...COLORES.fondoClaro);
    doc.rect(15, 276, 180, 20, 'F');
    
    // Información de la empresa en el pie - Columna izquierda
    doc.setFontSize(8);
    doc.setTextColor(...COLORES.texto);
    doc.setFont('helvetica', 'bold');
    doc.text(EMPRESA_CONFIG.nombre, 20, 282);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.texto);
    doc.text(`${EMPRESA_CONFIG.direccion}, ${EMPRESA_CONFIG.ciudad}`, 20, 286);
    doc.text(`${EMPRESA_CONFIG.email} | ${EMPRESA_CONFIG.web}`, 20, 290);
    
    // Información de contacto - Centro
    if (mostrarContacto) {
      doc.setTextColor(...COLORES.texto);
      doc.text(`Tel: ${EMPRESA_CONFIG.telefono}`, 105, 282, { align: 'center' });
      doc.text(`Cel: ${EMPRESA_CONFIG.celular}`, 105, 286, { align: 'center' });
      doc.text(`NIT: ${EMPRESA_CONFIG.nit}`, 105, 290, { align: 'center' });
    }
    
    // Número de página y fecha - Columna derecha
    doc.setTextColor(...COLORES.texto);
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${i} de ${pageCount}`, 190, 282, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.texto);
    const ahora = new Date().toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(ahora, 190, 286, { align: 'right' });
    
    // Texto personalizado o términos
    if (textoPersonalizado) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORES.texto);
      doc.text(textoPersonalizado, 105, 290, { align: 'center' });
    } else if (mostrarTerminos) {
      doc.setFontSize(7);
      doc.setTextColor(...COLORES.texto);
      doc.text('Este documento es válido como soporte contable - Resolución DIAN', 190, 290, { align: 'right' });
    }
  }
};

/**
 * Configuración estándar mejorada para tablas
 */
export const configuracionTabla = {
  styles: {
    font: 'helvetica',
    fontSize: 9,
    cellPadding: 6,
    textColor: COLORES.texto,
    lineColor: COLORES.gris,
    lineWidth: 0.2,
    valign: 'middle'
  },
  headStyles: {
    fillColor: COLORES.blanco,
    textColor: COLORES.texto,
    fontStyle: 'bold',
    fontSize: 10,
    cellPadding: 8,
    valign: 'middle'
  },
  alternateRowStyles: {
    fillColor: COLORES.blanco
  },
  tableLineColor: COLORES.gris,
  tableLineWidth: 0.2,
  margin: { left: 15, right: 15 },
  theme: 'grid'
};

/**
 * Configuración para tablas de resumen/totales
 */
export const configuracionTablaResumen = {
  styles: {
    font: 'helvetica',
    fontSize: 10,
    cellPadding: 8,
    textColor: COLORES.texto,
    lineColor: COLORES.gris,
    lineWidth: 0.3,
    valign: 'middle'
  },
  headStyles: {
    fillColor: COLORES.blanco,
    textColor: COLORES.texto,
    fontStyle: 'bold',
    fontSize: 11,
    cellPadding: 10
  },
  bodyStyles: {
    fontStyle: 'bold'
  },
  tableLineColor: COLORES.gris,
  tableLineWidth: 0.3,
  margin: { left: 15, right: 15 }
};

/**
 * Crea una sección de información con diseño profesional
 * @param {jsPDF} doc - Instancia del documento PDF
 * @param {string} titulo - Título de la sección
 * @param {Object} datos - Objeto con los datos a mostrar
 * @param {number} inicioY - Posición Y donde iniciar la sección
 * @param {Object} opciones - Opciones de diseño
 */
export const crearSeccionInformacion = (doc, titulo, datos, inicioY, opciones = {}) => {
  const {
    ancho = 180,
    alto = 'auto',
    columnas = 2,
    colorFondo = COLORES.fondoClaro,
    colorBorde = COLORES.gris,
    espaciado = 6, // espaciado vertical más compacto (antes 8)
    offsetValor = 30 // distancia entre etiqueta y valor (antes 35)
  } = opciones;
  
  // Calcular altura automática si no se especifica
  const numFilas = Math.ceil(Object.keys(datos).length / columnas);
  const alturaCalculada = alto === 'auto' ? (numFilas * espaciado) + 16 : alto;
  
  // Fondo de la sección (blanco)
  doc.setFillColor(...colorFondo);
  doc.rect(15, inicioY, ancho, alturaCalculada, 'F');
  
  // Marco de la sección
  doc.setDrawColor(...colorBorde);
  doc.setLineWidth(0.3);
  doc.rect(15, inicioY, ancho, alturaCalculada);
  
  // Título de la sección
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORES.texto);
  doc.text(titulo, 20, inicioY + 10);
  
  // Línea separadora bajo el título
  doc.setDrawColor(...COLORES.gris);
  doc.setLineWidth(0.3);
  doc.line(20, inicioY + 12, 190, inicioY + 12);
  
  // Datos en columnas
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const claves = Object.keys(datos);
  const anchoColumna = (ancho - 20) / columnas;
  
  claves.forEach((clave, index) => {
    const fila = Math.floor(index / columnas);
    const columna = index % columnas;
    
    const x = 20 + (columna * anchoColumna);
    const y = inicioY + 20 + (fila * espaciado);
    
    // Etiqueta en negrita
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORES.texto);
    doc.text(`${clave}:`, x, y);
    
    // Valor normal
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORES.texto);
    doc.text(String(datos[clave] || 'N/A'), x + offsetValor, y);
  });
  
  return inicioY + alturaCalculada + 5; // Retorna la nueva posición Y
};

/**
 * Crea una sección de totales con diseño profesional
 * @param {jsPDF} doc - Instancia del documento PDF
 * @param {Object} totales - Objeto con los totales a mostrar
 * @param {number} inicioY - Posición Y donde iniciar la sección
 * @param {Object} opciones - Opciones de diseño
 */
export const crearSeccionTotales = (doc, totales, inicioY, opciones = {}) => {
  const {
    ancho = 80,
    posicionX = 115,
    mostrarIVA = true,
    colorFondo = COLORES.fondoClaro,
    colorBorde = COLORES.gris
  } = opciones;
  
  const claves = Object.keys(totales);
  const altura = (claves.length * 8) + 16;
  
  // Fondo de la sección de totales (blanco)
  doc.setFillColor(...colorFondo);
  doc.rect(posicionX, inicioY, ancho, altura, 'F');
  
  // Marco de la sección
  doc.setDrawColor(...colorBorde);
  doc.setLineWidth(0.3);
  doc.rect(posicionX, inicioY, ancho, altura);
  
  // Título
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORES.texto);
  doc.text('RESUMEN', posicionX + (ancho / 2), inicioY + 8, { align: 'center' });
  
  // Línea separadora
  doc.setDrawColor(...COLORES.gris);
  doc.setLineWidth(0.3);
  doc.line(posicionX + 5, inicioY + 10, posicionX + ancho - 5, inicioY + 10);
  
  // Totales
  doc.setFontSize(10);
  let yPos = inicioY + 18;
  
  claves.forEach((clave) => {
    const esTotal = clave.toLowerCase().includes('total');
    
    // Etiqueta
    doc.setFont('helvetica', esTotal ? 'bold' : 'normal');
    doc.setTextColor(...COLORES.texto);
    doc.text(`${clave}`, posicionX + 5, yPos);
    
    // Valor
    doc.setFont('helvetica', esTotal ? 'bold' : 'normal');
    doc.setTextColor(...COLORES.texto);
    const valor = Number(totales[clave] || 0);
    const valorTexto = isNaN(valor) ? String(totales[clave]) : formatearMoneda(valor);
    doc.text(valorTexto, posicionX + ancho - 5, yPos, { align: 'right' });
    
    yPos += 8;
  });
  
  return inicioY + altura + 5;
};

/**
 * Formatea números como moneda colombiana
 * @param {number} valor - Valor numérico
 * @returns {string} - Valor formateado como moneda
 */
export const formatearMoneda = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor || 0);
};

/**
 * Formatea fechas en formato colombiano
 * @param {string|Date} fecha - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';
  
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  
  return fechaObj.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export { EMPRESA_CONFIG, COLORES };

/**
 * Genera un PDF tipo brochure para Pet Love con acentos amarillos.
 * El PDF incluye encabezado corporativo, una sección "Acerca de Pet Love",
 * una tabla de categorías y pie de página profesional.
 */
export const generarPDFPetLoveBrochure = () => {
  const doc = new jsPDF();

  // Encabezado con tipo BROCHURE y colores corporativos
  const inicioY = crearEncabezado(
    doc,
    'Pet Love',
    'Catálogo y beneficios para tus mascotas',
    'BROCHURE'
  );

  // Sección: Acerca de Pet Love
  const yDespuesAcerca = crearSeccionInformacion(
    doc,
    'Acerca de Pet Love',
    {
      'Experiencia': '10+ años cuidando y consintiendo mascotas',
      'Calidad': 'Productos premium seleccionados con cariño',
      'Envíos': '24-48h a nivel ciudad, proceso seguro',
      'Soporte': 'Asesoría veterinaria y servicio al cliente 24/7'
    },
    inicioY + 5,
    {
      colorFondo: COLORES.fondoClaro,
      colorBorde: COLORES.primario,
      columnas: 2
    }
  );

  // Sección: Categorías principales
  const categorias = [
    ['Alimentación', 'Alimentos premium y snacks saludables'],
    ['Juguetes', 'Diversión y desarrollo cognitivo'],
    ['Accesorios', 'Camas, correas y hogar de tu mascota'],
    ['Salud', 'Cuidado integral y bienestar']
  ];

  autoTable(doc, {
    ...configuracionTabla,
    head: [['Categoría', 'Descripción']],
    body: categorias,
    startY: yDespuesAcerca + 5,
    headStyles: {
      ...configuracionTabla.headStyles,
      fillColor: COLORES.primario,
      textColor: [0, 0, 0]
    }
  });

  // Resumen visual decorativo
  const despuesTablaY = doc.lastAutoTable.finalY || (yDespuesAcerca + 40);
  const resumenY = despuesTablaY + 8;
  crearSeccionTotales(
    doc,
    {
      'Clientes Felices': '8,500+',
      'Calificación Promedio': '4.9/5',
      'Recomendación': '99%',
      'Envío Rápido': '24h'
    },
    resumenY,
    {
      colorFondo: COLORES.fondoClaro,
      colorBorde: COLORES.primario,
      posicionX: 115,
      ancho: 80
    }
  );

  // Pie de página corporativo
  crearPiePagina(doc, {
    mostrarTerminos: true,
    mostrarContacto: true
  });

  doc.save('Pet Love - Brochure.pdf');
  return doc;
};

export const generarPDFEstandar = (titulo, subtitulo = '', encabezados = [], datos = [], nombreArchivo = 'documento.pdf') => {
  const doc = new jsPDF();
  const inicioY = crearEncabezado(doc, titulo, subtitulo, 'LISTADO');

  autoTable(doc, {
    ...configuracionTabla,
    head: [encabezados],
    body: datos,
    startY: inicioY + 5
  });

  crearPiePagina(doc, {
    mostrarTerminos: false,
    mostrarContacto: true
  });

  doc.save(nombreArchivo);
  return doc;
};
