export function isValidCssColor(value) {
  const el = document.createElement('span');
  el.style.backgroundColor = '';
  el.style.backgroundColor = String(value || '').trim();
  return el.style.backgroundColor !== '';
}

