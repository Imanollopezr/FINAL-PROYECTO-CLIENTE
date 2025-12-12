import { generarPDFEstandar } from './pdfUtils';

export const exportarProveedoresPDF = (proveedores) => {
  const encabezados = ['Nombre', 'Contacto', 'Teléfono', 'Tipo Persona', 'Tipo Documento', 'Documento', 'Estado'];
  
  const datos = proveedores.map(proveedor => [
    proveedor.nombre || 'N/A',
    proveedor.email || 'N/A',
    proveedor.telefono || proveedor.celular || 'N/A',
    proveedor.tipoPersona || 'N/A',
    proveedor.tipoDocumentoNombre || 'N/A',
    proveedor.documento || 'N/A',
    proveedor.activo ? 'Activo' : 'Inactivo'
  ]);
  
  const subtitulo = `Total de proveedores: ${proveedores.length}`;
  
  generarPDFEstandar(
    'LISTADO DE PROVEEDORES',
    subtitulo,
    encabezados,
    datos,
    'proveedores_petlove.pdf'
  );
};

export default exportarProveedoresPDF;
  