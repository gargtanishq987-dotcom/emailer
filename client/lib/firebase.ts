"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let firebaseApp: FirebaseApp;
let db: Firestore;

export function getClientApp(): FirebaseApp {
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  }
  return firebaseApp;
}

export function getClientDb(): Firestore {
  if (!db) {
    db = getFirestore(getClientApp());
  }
  return db;
}
