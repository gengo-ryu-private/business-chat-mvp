'use client';

import { useEffect, useState } from 'react';

import { TenantInfo } from '@/components/tenant/TenantInfo';
import { useAuth } from '@/features/auth/AuthProvider';
import { getTenant } from '@/lib/firestore/tenants';
import type { Tenant } from '@/types/models';

import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TenantPage() {
  return <TenantContent />;
}

function TenantContent() {
  const { appUser } = useAuth();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function fetchTenant() {
      if (!appUser) {
        setTenant(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');

        const fetchedTenant = await getTenant(appUser.tenantId);

        if (!fetchedTenant) {
          setErrorMessage('テナント情報が見つかりません。');
          return;
        }

        setTenant(fetchedTenant);
      } catch {
        setErrorMessage('テナント情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchTenant();
  }, [appUser]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">テナント情報</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          所属テナントとログインユーザーの情報を確認できます。
        </p>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">
          テナント情報を読み込み中...
        </p>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {!loading && tenant && appUser && (
        <TenantInfo tenant={tenant} appUser={appUser} />
      )}
    </main>
  );
}
