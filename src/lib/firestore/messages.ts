import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    setDoc,
    type FirestoreError,
    type Unsubscribe,
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

export async function createMessageWithAutoId(
    input: Omit<CreateMessageInput, 'id'>,
): Promise<string> {
    const messageRef = doc(
        collection(
            db,
            'tenants',
            input.tenantId,
            'channels',
            input.channelId,
            'messages',
        ),
    );

    await createMessage({
        ...input,
        id: messageRef.id,
    });

    return messageRef.id;
}

export function subscribeMessages(
    tenantId: string,
    channelId: string,
    onNext: (messages: Message[]) => void,
    onError: (error: FirestoreError) => void,
): Unsubscribe {
    const messagesRef = collection(
        db,
        'tenants',
        tenantId,
        'channels',
        channelId,
        'messages',
    );

    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

    return onSnapshot(
        messagesQuery,
        (snapshot) => {
            onNext(
                snapshot.docs.map(
                    (docSnapshot) =>
                        docSnapshot.data({
                            serverTimestamps: 'estimate',
                        }) as Message,
                ),
            );
        },
        onError,
    );
}
