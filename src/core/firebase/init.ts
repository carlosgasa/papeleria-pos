import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth y Firestore
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Configurar persistencia de auth (localStorage)
// En Android sería SharedPreferences
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Error setting auth persistence:', error);
});

// Configurar persistencia offline en Firestore
// Esto permite que la app funcione sin conexión a internet y sincronice después
// Equivalente a Room + WorkManager en Android para sincronización local/remota
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Múltiples pestañas abiertas, offline persistence deshabilitado');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser no soporta offline persistence');
  }
});

export default app;
