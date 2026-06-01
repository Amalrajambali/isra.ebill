import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __firebaseAdminApp: App | undefined;
}

function parseServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
      if (parsed.projectId && parsed.clientEmail && parsed.privateKey) {
        return {
          projectId: parsed.projectId,
          clientEmail: parsed.clientEmail,
          privateKey: parsed.privateKey.replace(/\\n/g, '\n'),
        };
      }
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function isFirestoreConfigured() {
  return Boolean(parseServiceAccount());
}

export function getAdminApp() {
  if (global.__firebaseAdminApp) return global.__firebaseAdminApp;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    throw new Error('Firebase admin credentials are not configured.');
  }

  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });

  global.__firebaseAdminApp = app;
  return app;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
