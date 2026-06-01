import 'server-only';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
const hasPartialEmulatorConfig =
    Boolean(authEmulatorHost) !== Boolean(firestoreEmulatorHost);
const usesFirebaseEmulator = Boolean(authEmulatorHost && firestoreEmulatorHost);

if (!projectId) {
    throw new Error('Missing Firebase project ID.');
}

if (hasPartialEmulatorConfig) {
    throw new Error(
        'Both FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are required for Firebase Emulator.',
    );
}

if (!usesFirebaseEmulator && (!clientEmail || !privateKey)) {
    throw new Error('Missing Firebase Admin environment variables.');
}

const app =
    getApps().length > 0
        ? getApps()[0]
        : initializeApp(
              usesFirebaseEmulator
                  ? { projectId }
                  : {
                        credential: cert({
                            projectId,
                            clientEmail,
                            privateKey,
                        }),
                    },
          );

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);
