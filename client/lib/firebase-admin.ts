import * as admin from "firebase-admin";
import type { App } from "firebase-admin/app";

let app: App | undefined;

function getApp(): App {
  if (app) return app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const privateKey = rawKey
    .replace(/\\n/g, "\n")
    .replace(/^["']|["']$/g, "")
    .trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }

  if (admin.apps.length > 0) {
    app = admin.apps[0]!;
    return app;
  }

  app = admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  return app;
}

export function getDb() {
  return admin.firestore(getApp());
}

export function getAdminAuth() {
  return admin.auth(getApp());
}

export { admin };
