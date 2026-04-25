import { describe, it, expect, vi, beforeEach } from 'vitest'
import { can, requirePermission } from '../rbac-utils'
import { db } from '../../db'
import { withAdminTenantDb, type TenantTransaction } from '../../db/tenant-db'

// Mock the database layer
vi.mock('../../db', () => ({
  db: {
    query: {
      members: {
        findFirst: vi.fn(),
      },
    },
  },
}))

// Mock the tenant database isolation layer
vi.mock('../../db/tenant-db', () => ({
  withAdminTenantDb: vi.fn(),
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

describe('RBAC Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('can()', () => {
    it('should return true if user has the required permission', async () => {
      // 1. Mock public schema membership check
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        roleId: 'role-admin',
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

      // 2. Mock tenant schema permission check
      vi.mocked(withAdminTenantDb).mockImplementation(async (_orgId: string, cb: (tx: TenantTransaction) => Promise<unknown>) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue({ 
                roleId: 'role-admin', 
                permissionKey: 'org:update' 
              })
            }
          }
        }
        return cb(mockTx as unknown as TenantTransaction)
      })

      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(true)
      expect(db.query.members.findFirst).toHaveBeenCalled()
      expect(withAdminTenantDb).toHaveBeenCalledWith('org-1', expect.any(Function))
    })

    it('should return false if user is not a member of the organization', async () => {
      vi.mocked(db.query.members.findFirst).mockResolvedValue(undefined)
      
      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(false)
      expect(withAdminTenantDb).not.toHaveBeenCalled()
    })

    it('should return false if the role does not have the permission', async () => {
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'viewer',
        roleId: 'role-viewer',
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

      vi.mocked(withAdminTenantDb).mockImplementation(async (_orgId: string, cb: (tx: TenantTransaction) => Promise<unknown>) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue(undefined) // No permission found
            }
          }
        }
        return cb(mockTx as unknown as TenantTransaction)
      })

      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(false)
    })
  })

  describe('requirePermission()', () => {
    it('should throw a Forbidden error if permission is missing', async () => {
      // Mock 'can' returning false
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'viewer',
        roleId: 'role-viewer',
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
      vi.mocked(withAdminTenantDb).mockImplementation(async (_orgId: string, cb: (tx: TenantTransaction) => Promise<unknown>) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue(undefined)
            }
          }
        }
        return cb(mockTx as unknown as TenantTransaction)
      })

      await expect(requirePermission('user-1', 'org-1', 'org:update'))
        .rejects.toThrow('Forbidden: Missing required permission: org:update')
    })

    it('should not throw if permission is granted', async () => {
      vi.mocked(db.query.members.findFirst).mockResolvedValue({
        id: 'member-1',
        userId: 'user-1',
        organizationId: 'org-1',
        role: 'admin',
        roleId: 'role-admin',
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
      vi.mocked(withAdminTenantDb).mockImplementation(async (_orgId: string, cb: (tx: TenantTransaction) => Promise<unknown>) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue({ 
                id: 'perm-1',
                roleId: 'role-admin', 
                permissionKey: 'org:update' 
              })
            }
          }
        }
        return cb(mockTx as unknown as TenantTransaction)
      })

      await expect(requirePermission('user-1', 'org-1', 'org:update'))
        .resolves.not.toThrow()
    })
  })
})
