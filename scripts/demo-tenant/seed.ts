import { Timestamp, type Firestore } from 'firebase-admin/firestore';

type DemoSeedUser = {
  displayName: string;
  uid: string;
};

type BuildDemoSeedInput = {
  admin: DemoSeedUser;
  db: Firestore;
  member: DemoSeedUser;
  tenantId: string;
  timestamp: Timestamp;
};

export function addDemoSeedToBatch(
  batch: FirebaseFirestore.WriteBatch,
  input: BuildDemoSeedInput
): void {
  const channels = [
    {
      description: '運用からのお知らせを確認するチャンネルです。',
      id: 'announcements',
      name: 'お知らせ',
    },
    {
      description: 'メンバー同士で気軽に会話するチャンネルです。',
      id: 'general',
      name: '雑談',
    },
  ] as const;

  for (const channel of channels) {
    const channelRef = input.db
      .collection('tenants')
      .doc(input.tenantId)
      .collection('channels')
      .doc(channel.id);

    batch.create(channelRef, {
      ...channel,
      createdAt: input.timestamp,
      createdBy: input.admin.uid,
      tenantId: input.tenantId,
      updatedAt: input.timestamp,
    });
  }

  const messages = [
    {
      body: 'デモ環境へようこそ。チャンネルとメッセージ機能をご確認ください。',
      channelId: 'announcements',
      id: 'welcome',
      sender: input.admin,
    },
    {
      body: 'お知らせを確認しました。',
      channelId: 'announcements',
      id: 'acknowledged',
      sender: input.member,
    },
    {
      body: 'こんにちは。こちらは架空のデモ用メッセージです。',
      channelId: 'general',
      id: 'greeting',
      sender: input.member,
    },
    {
      body: 'こんにちは。リアルタイム更新もお試しください。',
      channelId: 'general',
      id: 'reply',
      sender: input.admin,
    },
  ] as const;

  messages.forEach((message, index) => {
    const messageRef = input.db
      .collection('tenants')
      .doc(input.tenantId)
      .collection('channels')
      .doc(message.channelId)
      .collection('messages')
      .doc(message.id);

    batch.create(messageRef, {
      body: message.body,
      channelId: message.channelId,
      createdAt: Timestamp.fromMillis(input.timestamp.toMillis() + index + 1),
      id: message.id,
      senderId: message.sender.uid,
      senderName: message.sender.displayName,
      tenantId: input.tenantId,
    });
  });
}

export async function verifyDemoSeed(input: {
  adminUid: string;
  db: Firestore;
  memberUid: string;
  tenantId: string;
}): Promise<void> {
  const channelsRef = input.db
    .collection('tenants')
    .doc(input.tenantId)
    .collection('channels');
  const [channels, announcementMessages, generalMessages] = await Promise.all([
    channelsRef.get(),
    channelsRef.doc('announcements').collection('messages').get(),
    channelsRef.doc('general').collection('messages').get(),
  ]);

  const channelIds = channels.docs.map((channel) => channel.id).sort();
  const announcementIds = announcementMessages.docs
    .map((message) => message.id)
    .sort();
  const generalIds = generalMessages.docs.map((message) => message.id).sort();

  if (
    channelIds.join(',') !== 'announcements,general' ||
    announcementIds.join(',') !== 'acknowledged,welcome' ||
    generalIds.join(',') !== 'greeting,reply' ||
    announcementMessages.docs.some(
      (message) => message.get('tenantId') !== input.tenantId
    ) ||
    generalMessages.docs.some(
      (message) => message.get('tenantId') !== input.tenantId
    ) ||
    announcementMessages.docs
      .find((message) => message.id === 'welcome')
      ?.get('senderId') !== input.adminUid ||
    announcementMessages.docs
      .find((message) => message.id === 'acknowledged')
      ?.get('senderId') !== input.memberUid ||
    generalMessages.docs
      .find((message) => message.id === 'greeting')
      ?.get('senderId') !== input.memberUid ||
    generalMessages.docs
      .find((message) => message.id === 'reply')
      ?.get('senderId') !== input.adminUid
  ) {
    throw new Error('Demo seed verification failed.');
  }
}
