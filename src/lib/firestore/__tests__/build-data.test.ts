import { describe, expect, it } from 'vitest';

import {
  buildAppUserData,
  buildChannelData,
  buildMessageData,
  buildTenantData,
  buildTenantSecretData,
} from '@/lib/firestore/build-data';

describe('firestore build-data', () => {
  describe('buildAppUserData', () => {
    it('ユーザー保存用データに作成日時と更新日時を付与する', () => {
      const data = buildAppUserData({
        id: 'user-001',
        displayName: '山田太郎',
        email: 'yamada@example.com',
        tenantId: 'tenant-001',
        role: 'admin',
      });

      expect(data).toMatchObject({
        id: 'user-001',
        displayName: '山田太郎',
        email: 'yamada@example.com',
        tenantId: 'tenant-001',
        role: 'admin',
      });
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });
  });

  describe('buildTenantData', () => {
    it('テナント保存用データに作成日時と更新日時を付与する', () => {
      const data = buildTenantData({
        id: 'tenant-001',
        name: 'サンプル開発チーム',
        createdBy: 'user-001',
      });

      expect(data).toMatchObject({
        id: 'tenant-001',
        name: 'サンプル開発チーム',
        createdBy: 'user-001',
      });
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });
  });

  describe('buildTenantSecretData', () => {
    it('参加コード保存用データに作成日時と更新日時を付与する', () => {
      const data = buildTenantSecretData({
        tenantId: 'tenant-001',
        joinCode: 'ABC2345678',
      });

      expect(data).toMatchObject({
        tenantId: 'tenant-001',
        joinCode: 'ABC2345678',
      });
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });
  });

  describe('buildChannelData', () => {
    it('チャンネル保存用データに作成日時と更新日時を付与する', () => {
      const data = buildChannelData({
        id: 'channel-001',
        tenantId: 'tenant-001',
        name: 'general',
        description: '全体連絡用チャンネル',
        createdBy: 'user-001',
      });

      expect(data).toMatchObject({
        id: 'channel-001',
        tenantId: 'tenant-001',
        name: 'general',
        description: '全体連絡用チャンネル',
        createdBy: 'user-001',
      });
      expect(data.createdAt).toBeDefined();
      expect(data.updatedAt).toBeDefined();
    });

    it('説明が undefined の場合は保存用データから除外する', () => {
      const data = buildChannelData({
        id: 'channel-001',
        tenantId: 'tenant-001',
        name: 'general',
        description: undefined,
        createdBy: 'user-001',
      });

      expect(data).not.toHaveProperty('description');
    });
  });

  describe('buildMessageData', () => {
    it('メッセージ保存用データに作成日時を付与する', () => {
      const data = buildMessageData({
        id: 'message-001',
        tenantId: 'tenant-001',
        channelId: 'channel-001',
        body: '本日の進捗です。',
        senderId: 'user-001',
        senderName: '山田太郎',
      });

      expect(data).toMatchObject({
        id: 'message-001',
        tenantId: 'tenant-001',
        channelId: 'channel-001',
        body: '本日の進捗です。',
        senderId: 'user-001',
        senderName: '山田太郎',
      });
      expect(data.createdAt).toBeDefined();
    });
  });
});
