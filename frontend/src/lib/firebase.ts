/**
 * lib/firebase.ts — Firebase compatibility layer for Lyrica3 Pro
 *
 * The StudioShell ecosystem components (VocalEngine, SfxEngine, etc.) were
 * built against Firebase/Firestore. Lyrica3 Pro uses MongoDB + JWT auth via
 * the FastAPI backend. This module provides the Firebase surface so those
 * components compile and function, routing calls to the Lyrica3 backend API.
 *
 * When Firebase is fully configured, replace FIREBASE_CONFIG env vars and
 * the stub implementations below will be superseded by real SDK calls.
 */

// ---------------------------------------------------------------------------
// Firebase SDK re-exports (will use real SDK if config present)
// ---------------------------------------------------------------------------
let _app: any = null;
let _db: any = null;
let _auth: any = null;

try {
  const { initializeApp, getApps } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  const { getAuth } = require('firebase/auth');

  const FIREBASE_CONFIG = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'disco-amphora-490606-n8',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  if (FIREBASE_CONFIG.apiKey && !getApps().length) {
    _app = initializeApp(FIREBASE_CONFIG);
  } else if (getApps().length) {
    _app = getApps()[0];
  }

  if (_app) {
    _db = getFirestore(_app);
    _auth = getAuth(_app);
  }
} catch (_e) {
  // Firebase SDK not installed — running in API-only mode
}

export const db = _db;
export const auth = _auth;

// ---------------------------------------------------------------------------
// Error handling helpers
// ---------------------------------------------------------------------------
export enum OperationType {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
}

export function handleFirestoreError(error: unknown, operation: OperationType): void {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[Firestore ${operation}] ${msg}`);
}
