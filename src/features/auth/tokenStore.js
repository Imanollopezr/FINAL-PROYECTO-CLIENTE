let currentToken = null;

// Clave usada en localStorage para el token
const LS_KEY = 'authToken';

export const setToken = (token) => {
  currentToken = token || null;
  try {
    if (token) {
      window.localStorage.setItem(LS_KEY, token);
    } else {
      window.localStorage.removeItem(LS_KEY);
    }
  } catch {
    // Si localStorage falla (modo SSR o restricciones), seguimos con memoria
  }
};

export const getToken = () => {
  if (currentToken) return currentToken;
  try {
    const lsToken = window.localStorage.getItem(LS_KEY);
    currentToken = lsToken || null;
  } catch {
    // Ignorar errores de acceso a localStorage
  }
  return currentToken;
};

export const clearToken = () => {
  currentToken = null;
  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // Ignorar errores de acceso a localStorage
  }
};
