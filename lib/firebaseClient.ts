// Client-side Firebase initialization for web SDK
// TODO: Fill in NEXT_PUBLIC_FIREBASE_* environment variables in your Vercel/loca env.

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Database | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };

    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.databaseURL) {
      // This helps during local dev if env vars are missing.
      // eslint-disable-next-line no-console
      console.warn('Firebase client config is incomplete. Check NEXT_PUBLIC_FIREBASE_* env vars.');
    }

    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirebaseDatabase(): Database {
  if (!db) {
    db = getDatabase(getFirebaseApp());
  }
  return db;
}

// Export initialized instances for direct use
export { db };

// Initialize on first import
getFirebaseApp();
getFirebaseDatabase();
