// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'

// Helper: validate required env vars and provide friendly errors
const requiredEnv = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missing = requiredEnv.filter((key) => !import.meta.env[key])

if (missing.length) {
  // Log a clear error in console to aid debugging
  // We avoid throwing here to allow the UI to render error messages gracefully
  console.error(
    `Configuración Firebase incompleta. Faltan variables: ${missing.join(', ')}. ` +
      'Verifica tu archivo `.env` y que empiecen con `VITE_`. '
  )
}

// Export a flag to indicate whether Firebase is properly configured
export const isFirebaseConfigured = missing.length === 0

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase only if properly configured
let app = null
let auth = null
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
  } catch (err) {
    console.error('Error inicializando Firebase:', err)
    if (String(err?.message || '').includes('invalid api key') || String(err?.code || '').includes('auth/invalid-api-key')) {
      console.error('La API key de Firebase es inválida. Revisa `VITE_FIREBASE_API_KEY`.')
    }
    // Mantener la app funcional sin Firebase
    app = null
    auth = null
  }
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // Guard: avoid calling Firebase when env config is missing
    if (!isFirebaseConfigured || !firebaseConfig.apiKey) {
      const msg = missing.length
        ? `Configuración Firebase incompleta. Faltan: ${missing.join(', ')}`
        : 'API Key de Firebase vacía o inválida'
      return { success: false, error: msg }
    }
    if (!auth) {
      return { success: false, error: 'Firebase Auth no inicializado por configuración incompleta' }
    }
    const result = await signInWithPopup(auth, googleProvider)
    return { success: true, user: result.user }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    // Friendlier error mapping for common misconfigurations
    const msg =
      error?.code === 'auth/invalid-api-key'
        ? 'Configuración inválida de Firebase: API Key incorrecta'
        : error?.code === 'auth/configuration-not-found'
        ? 'Configuración de OAuth no encontrada en Firebase'
        : error?.message || 'Error desconocido al iniciar sesión con Google'
    return { success: false, error: msg }
  }
}

// Sign out
export const signOut = async () => {
  try {
    if (!auth) {
      return { success: true }
    }
    await firebaseSignOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return { success: false, error: error.message }
  }
}

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  if (!auth) {
    // No-op unsubscribe
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}

// Export auth reference (may be null when not configured)
export { auth }