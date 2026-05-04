import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase/client';
import { buildAppUserData } from '@/lib/firestore/build-data';
import type { AppUser, CreateAppUserInput } from '@/types/models';

export async function createAppUser(input: CreateAppUserInput): Promise<void> {
    await setDoc(doc(db, 'users', input.id), buildAppUserData(input));
}

export async function getAppUser(userId: string): Promise<AppUser | null> {
    const snapshot = await getDoc(doc(db, 'users', userId));

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as AppUser;
}
