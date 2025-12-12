// Formatea número estilo CLP, redondeando a 'decimals' (por defecto 2)
export const formatPriceCL = (value, decimals = 2) => {
  if (value === null || value === undefined) return '$ 0';
  const num = typeof value === 'number' ? value : parsePriceCL(value);
  if (!Number.isFinite(num)) return '$ 0';

  const factor = Math.pow(10, Math.max(0, decimals));
  const rounded = factor > 0 ? Math.round(num * factor) / factor : num;

  const [intRaw, decRaw] = rounded
    .toFixed(Math.max(0, decimals))
    .split('.');

  const intPart = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = decRaw ? decRaw.replace(/0+$/, '') : '';

  return decPart ? `$ ${intPart},${decPart}` : `$ ${intPart}`;
};

// Convierte un string formateado CLP a número (float)
// Ej: "$2.450" -> 2450 ; "2.450,50" -> 2450.5
export const parsePriceCL = (input) => {
  if (input === null || input === undefined) return 0;
  const str = String(input)
    .replace(/[^0-9,\.]/g, '') // mantener dígitos y separadores
    .replace(/\./g, '') // quitar puntos de miles
    .replace(/,/g, '.'); // convertir coma decimal a punto
  const num = parseFloat(str);
  return Number.isNaN(num) ? 0 : num;
};