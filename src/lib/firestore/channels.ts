import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/client';
import { buildChannelData } from '@/lib/firestore/build-data';
import type { Channel, CreateChannelInput } from '@/types/models';

export async function createChannel(input: CreateChannelInput): Promise<void> {
    await setDoc(
        doc(db, 'tenants', input.tenantId, 'channels', input.id),
        buildChannelData(input),
    );
}

export async function getChannels(tenantId: string): Promise<Channel[]> {
    const channelsRef = collection(db, 'tenants', tenantId, 'channels');
    const channelsQuery = query(channelsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(channelsQuery);

    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Channel);
}
