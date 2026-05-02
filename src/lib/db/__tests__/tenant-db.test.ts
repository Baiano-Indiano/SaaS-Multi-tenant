import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTenantDb, withAdminTenantDb, type TenantTransaction } from '../tenant-db'
import { db } from '../index'

// Mock the core database client
vi.mock('../index', () => ({
  db: {
    query: {
      members: {
        findFirst: vi.fn(),
      },
      organizations: {
        findFirst: vi.fn(),
      },
    },
    transaction: vi.fn(),
  },
}))

interface MockMember {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  roleId: string | null;
  createdAt: Date;
  organization: {
    id: string;
    name: string;
    tenantSchemaName: string;
    createdAt: Date;
    plan: string;
    domainVerified: boolean;
    require2FA: boolean;
  };
}

interface MockOrganization {
  id: string;
  name: string;
  tenantSchemaName: string;
  createdAt: Date;
  plan: string;
  domainVerified: boolean;
  require2FA: boolean;
  slug: string | null;
  logo: string | null;
  metadata: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  customDomain: string | null;
  verificationToken: string | null;
}

describe('Tenant Database Isolation (tenant-db.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTenantDb()', () => {
    it('should isolate connection by setting search_path for valid members', async () => {
      // 1. Mock successful membership check
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        createdAt: new Date(),
        organization: {
          id: 'org-1',
          name: 'Atomic Inc',
          tenantSchemaName: 'tenant_org_1',
          createdAt: new Date(),
          plan: 'free',
          domainVerified: false,
          require2FA: false
        }
      } as unknown as MockMember)

      // 2. Mock transaction execution
      const mockTx = {
        execute: vi.fn().mockResolvedValue({}),
      }
      vi.mocked(db.transaction).mockImplementation(async (cb: (tx: TenantTransaction) => Promise<unknown>) => cb(mockTx as unknown as TenantTransaction))

      const mockCallback = vi.fn().mockResolvedValue('data')

      const result = await getTenantDb('user-1', 'org-1', mockCallback)

      expect(result).toBe('data')
      // Verify isolation command was sent
      expect(mockTx.execute).toHaveBeenCalled()
      // Verify callback was executed with the transaction object
      expect(mockCallback).toHaveBeenCalledWith(mockTx)
    })

    it('should reject access if user is not a member of the organization', async () => {
      vi.mocked(db.query.members.findFirst).mockResolvedValue(undefined)

      await expect(getTenantDb('user-1', 'org-1', async () => { }))
        .rejects.toThrow('Access Denied: You are not a member of this organization.')

      expect(db.transaction).not.toHaveBeenCalled()
    })

    it('should prevent SQL injection by validating the schema name format', async () => {
      // Malicious schema name that passed through the DB somehow
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        createdAt: new Date(),
        organization: {
          id: 'org-1',
          name: 'Atomic Inc',
          tenantSchemaName: 'public"; DROP TABLE users; --',
          createdAt: new Date(),
          plan: 'free',
          domainVerified: false,
          require2FA: false
        }
      } as unknown as MockMember)

      await expect(getTenantDb('user-1', 'org-1', async () => { }))
        .rejects.toThrow('Invalid tenant schema name detected. Aborting.')

      expect(db.transaction).not.toHaveBeenCalled()
    })
  })

  describe('withAdminTenantDb()', () => {
    it('should allow administrative access to tenant data via organization ID', async () => {
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({
        id: 'org-1',
        name: 'Atomic Inc',
        tenantSchemaName: 'tenant_org_1',
        createdAt: new Date(),
        plan: 'free',
        domainVerified: false,
        require2FA: false
      } as unknown as MockOrganization)

      const mockTx = {
        execute: vi.fn().mockResolvedValue({}),
      }
      vi.mocked(db.transaction).mockImplementation(async (cb: (tx: TenantTransaction) => Promise<unknown>) => cb(mockTx as unknown as TenantTransaction))

      const result = await withAdminTenantDb('org-1', async () => 'admin-ok')

      expect(result).toBe('admin-ok')
      expect(mockTx.execute).toHaveBeenCalled()
    })

    it('should throw if the organization or its schema does not exist', async () => {
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue(undefined)

      await expect(withAdminTenantDb('non-existent', async () => { }))
        .rejects.toThrow('Organization or tenant schema not found.')
    })
  })
})
