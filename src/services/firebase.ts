import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocFromServer,
} from 'firebase/firestore';
import baseConfig from '../../firebase-applet-config.json';

// Error handling enum and interface conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const sanitizeDomain = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
};

/**
 * Resolve effective Firebase configuration:
 * Supports Vercel environment variables (VITE_FIREBASE_*) with automatic fallback to firebase-applet-config.json
 */
export const effectiveFirebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY || baseConfig.apiKey || '').trim(),
  authDomain: sanitizeDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || baseConfig.authDomain || ''),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || baseConfig.projectId || '').trim(),
  storageBucket: sanitizeDomain(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || baseConfig.storageBucket || ''),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || baseConfig.messagingSenderId || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID || baseConfig.appId || '').trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || baseConfig.measurementId || '').trim(),
  firestoreDatabaseId: (
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    (baseConfig as any).firestoreDatabaseId ||
    'ai-studio-collectiqsmartin-589e7824-7143-495a-af4b-802bda12a604'
  ).trim(),
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isConnected = false;

try {
  // Prevent duplicate initialization in HMR / fast reload
  app = getApps().length === 0 ? initializeApp(effectiveFirebaseConfig) : getApps()[0];
  auth = getAuth(app);

  const targetDbId = effectiveFirebaseConfig.firestoreDatabaseId?.trim();
  if (!targetDbId || targetDbId === '(default)') {
    db = getFirestore(app);
  } else {
    try {
      db = getFirestore(app, targetDbId);
    } catch {
      console.warn('Failed to bind custom Firestore databaseId, initializing default Firestore database.');
      db = getFirestore(app);
    }
  }

  isConnected = true;
} catch (e) {
  console.error('Firebase initialization error:', e);
}

// Critical Constraint: Test connection to Firestore on boot with auto-fallback
async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error) {
      // If custom database is NOT_FOUND or offline, attempt fallback to default database instance
      if (
        (error.message.includes('NOT_FOUND') || error.message.includes('the client is offline')) &&
        effectiveFirebaseConfig.firestoreDatabaseId &&
        effectiveFirebaseConfig.firestoreDatabaseId !== '(default)'
      ) {
        console.warn('Custom databaseId returned NOT_FOUND. Attempting connection to default Firestore database...');
        try {
          const defaultDb = getFirestore(app);
          await getDocFromServer(doc(defaultDb, 'test', 'connection'));
          db = defaultDb;
          console.log('Successfully connected to default Firestore database.');
          return;
        } catch {
          // Both failed
        }
      }
      if (error.message.includes('the client is offline')) {
        console.error('Please check your Firebase configuration or internet connection.');
      }
    }
  }
}

// Execute connection test
testConnection();

export { app, auth, db, isConnected };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.uid,
      email: currentAuth?.email,
      emailVerified: currentAuth?.emailVerified,
      isAnonymous: currentAuth?.isAnonymous,
      tenantId: currentAuth?.tenantId,
      providerInfo:
        currentAuth?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
