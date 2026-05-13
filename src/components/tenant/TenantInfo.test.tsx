import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TenantInfo } from '@/components/tenant/TenantInfo';
import { adminUser, memberUser, tenant } from '@/test/factories';

describe('TenantInfo', () => {
    it('shows join code for admin users', () => {
        render(<TenantInfo tenant={tenant} appUser={adminUser} />);

        expect(screen.getByText('参加コード')).toBeInTheDocument();
        expect(screen.getByText('TEST123')).toBeInTheDocument();
    });

    it('hides join code for member users', () => {
        render(<TenantInfo tenant={tenant} appUser={memberUser} />);

        expect(screen.queryByText('参加コード')).not.toBeInTheDocument();
        expect(screen.queryByText('TEST123')).not.toBeInTheDocument();
    });
});
