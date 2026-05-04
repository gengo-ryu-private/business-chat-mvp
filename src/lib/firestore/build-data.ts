import { serverTimestamp } from 'firebase/firestore';

import type {
    CreateAppUserInput,
    CreateChannelInput,
    CreateMessageInput,
    CreateTenantInput,
} from '@/types/models';

export function buildAppUserData(input: CreateAppUserInput) {
    return {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

export function buildTenantData(input: CreateTenantInput) {
    return {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

export function buildChannelData(input: CreateChannelInput) {
    return {
        ...input,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
}

export function buildMessageData(input: CreateMessageInput) {
    return {
        ...input,
        createdAt: serverTimestamp(),
    };
}
