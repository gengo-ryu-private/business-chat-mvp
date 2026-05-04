import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    setDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/client';
import { buildMessageData } from '@/lib/firestore/build-data';
import type { CreateMessageInput, Message } from '@/types/models';

export async function createMessage(input: CreateMessageInput): Promise<void> {
    await setDoc(
        doc(
            db,
            'tenants',
            input.tenantId,
            'channels',
            input.channelId,
            'messages',
            input.id,
        ),
        buildMessageData(input),
    );
}

export async function getMessages(
    tenantId: string,
    channelId: string,
): Promise<Message[]> {
    const messagesRef = collection(
        db,
        'tenants',
        tenantId,
        'channels',
        channelId,
        'messages',
    );

    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(messagesQuery);

    return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Message);
}
