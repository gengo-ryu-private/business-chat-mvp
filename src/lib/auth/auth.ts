import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from 'firebase/auth';

import { auth } from '@/lib/firebase/client';

export async function signUpWithEmail(
    email: string,
    password: string,
): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
    );

    return credential.user;
}

export async function loginWithEmail(
    email: string,
    password: string,
): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    return credential.user;
}

export async function logout(): Promise<void> {
    await signOut(auth);
}

export function listenAuthState(
    callback: (user: User | null) => void,
): () => void {
    return onAuthStateChanged(auth, callback);
}
