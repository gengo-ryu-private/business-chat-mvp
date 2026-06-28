import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TenantInfo } from '@/components/tenant/TenantInfo';
import { adminUser, memberUser, tenant } from '@/test/factories';

describe('TenantInfo', () => {
  it('管理者ユーザーに参加コードを表示する', () => {
    render(<TenantInfo tenant={tenant} appUser={adminUser} />);

    expect(screen.getByText('参加コード')).toBeInTheDocument();
    expect(screen.getByText('TEST123')).toBeInTheDocument();
  });

  it('一般ユーザーに参加コードを表示しない', () => {
    render(<TenantInfo tenant={tenant} appUser={memberUser} />);

    expect(screen.queryByText('参加コード')).not.toBeInTheDocument();
    expect(screen.queryByText('TEST123')).not.toBeInTheDocument();
  });
});
