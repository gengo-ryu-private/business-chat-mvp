import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/client';
import { buildTenantData } from '@/lib/firestore/build-data';
import type { CreateTenantInput, Tenant } from '@/types/models';

export async function createTenant(input: CreateTenantInput): Promise<void> {
    await setDoc(doc(db, 'tenants', input.id), buildTenantData(input));
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
    const snapshot = await getDoc(doc(db, 'tenants', tenantId));

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as Tenant;
}

export async function findTenantByJoinCode(
    joinCode: string,
): Promise<Tenant | null> {
    const tenantsRef = collection(db, 'tenants');
    const tenantsQuery = query(tenantsRef, where('joinCode', '==', joinCode));
    const snapshot = await getDocs(tenantsQuery);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as Tenant;
}
