// Server-side Firebase Admin initialization
// TODO: Configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars.

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getDatabase, type Database } from 'firebase-admin/database';

let adminApp: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Database | undefined;

export function getAdminApp(): App {
  if (!adminApp) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      // eslint-disable-next-line no-console
      console.warn('Firebase Admin env vars are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
    }

    if (privateKey?.includes('YOUR_PRIVATE_KEY_CONTENTS')) {
      console.error('ERROR: FIREBASE_PRIVATE_KEY is set to the placeholder value. Please update .env.local with your real Firebase Admin Private Key.');
    }

    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    adminApp = getApps()[0] ??
      initializeApp({
        credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : undefined,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
  }
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuth) {
    adminAuth = getAuth(getAdminApp());
  }
  return adminAuth;
}

export function getAdminDatabase(): Database {
  if (!adminDb) {
    adminDb = getDatabase(getAdminApp());
  }
  return adminDb;
}

export async function verifyIdTokenFromHeader(authorizationHeader: string | null): Promise<DecodedIdToken | null> {
  if (!authorizationHeader?.startsWith('Bearer ')) return null;
  const token = authorizationHeader.substring('Bearer '.length).trim();
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to verify Firebase ID token', err);
    return null;
  }
}
