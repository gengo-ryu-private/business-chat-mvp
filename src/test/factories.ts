import { Timestamp } from 'firebase/firestore';

import type {
  AppUser,
  Channel,
  Message,
  Tenant,
  TenantSecret,
} from '@/types/models';

const now = Timestamp.fromDate(new Date('2026-05-11T08:00:00.000Z'));

export const adminUser: AppUser = {
  id: 'admin-user',
  displayName: '管理者ユーザー',
  email: 'admin@example.com',
  tenantId: 'tenant-1',
  role: 'admin',
  createdAt: now,
  updatedAt: now,
};

export const memberUser: AppUser = {
  id: 'member-user',
  displayName: '一般ユーザー',
  email: 'member@example.com',
  tenantId: 'tenant-1',
  role: 'member',
  createdAt: now,
  updatedAt: now,
};

export const tenant: Tenant = {
  id: 'tenant-1',
  name: 'テストテナント',
  createdBy: adminUser.id,
  createdAt: now,
  updatedAt: now,
};

export const tenantSecret: TenantSecret = {
  tenantId: tenant.id,
  joinCode: 'TEST123',
  createdAt: now,
  updatedAt: now,
};

export const channel: Channel = {
  id: 'channel-1',
  tenantId: 'tenant-1',
  name: 'general',
  description: '全体連絡',
  createdBy: adminUser.id,
  createdAt: now,
  updatedAt: now,
};

export const message: Message = {
  id: 'message-1',
  tenantId: 'tenant-1',
  channelId: 'channel-1',
  body: 'テストメッセージです。',
  senderId: memberUser.id,
  senderName: memberUser.displayName,
  createdAt: now,
};
