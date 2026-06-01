import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

declare global {
    var __businessChatFirebaseEmulatorsConnected: boolean | undefined;
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredEnvValues = Object.entries(firebaseConfig);

for (const [key, value] of requiredEnvValues) {
    if (!value) {
        throw new Error(`Missing Firebase environment variable: ${key}`);
    }
}

const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' &&
    !globalThis.__businessChatFirebaseEmulatorsConnected
) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
        disableWarnings: true,
    });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    globalThis.__businessChatFirebaseEmulatorsConnected = true;
}
