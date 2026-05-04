import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'member';

export type AppUser = {
    id: string;
    displayName: string;
    email: string;
    tenantId: string;
    role: UserRole;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Tenant = {
    id: string;
    name: string;
    joinCode: string;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Channel = {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Message = {
    id: string;
    tenantId: string;
    channelId: string;
    body: string;
    senderId: string;
    senderName: string;
    createdAt: Timestamp;
};

export type CreateAppUserInput = Omit<AppUser, 'createdAt' | 'updatedAt'>;

export type CreateTenantInput = Omit<Tenant, 'createdAt' | 'updatedAt'>;

export type CreateChannelInput = Omit<Channel, 'createdAt' | 'updatedAt'>;

export type CreateMessageInput = Omit<Message, 'createdAt'>;
