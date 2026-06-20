import {
  collection,
  doc,
  getDoc,
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
    buildChannelData(input)
  );
}

export async function createChannelWithAutoId(
  input: Omit<CreateChannelInput, 'id'>
): Promise<string> {
  const channelRef = doc(collection(db, 'tenants', input.tenantId, 'channels'));

  await createChannel({
    ...input,
    id: channelRef.id,
  });

  return channelRef.id;
}

export async function getChannels(tenantId: string): Promise<Channel[]> {
  const channelsRef = collection(db, 'tenants', tenantId, 'channels');
  const channelsQuery = query(channelsRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(channelsQuery);

  return snapshot.docs.map((docSnapshot) => docSnapshot.data() as Channel);
}

export async function getChannel(
  tenantId: string,
  channelId: string
): Promise<Channel | null> {
  const snapshot = await getDoc(
    doc(db, 'tenants', tenantId, 'channels', channelId)
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Channel;
}
