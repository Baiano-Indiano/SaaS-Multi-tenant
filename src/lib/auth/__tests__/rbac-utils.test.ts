import { describe, it, expect, vi, beforeEach } from 'vitest'
import { can, requirePermission } from '../rbac-utils'
import { db } from '../../db'
import { withAdminTenantDb } from '../../db/tenant-db'

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

describe('RBAC Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('can()', () => {
    it('should return true if user has the required permission', async () => {
      // 1. Mock public schema membership check
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        roleId: 'role-admin',
        organization: {
          tenantSchemaName: 'tenant_org_1'
        }
      })

      // 2. Mock tenant schema permission check
      ;(withAdminTenantDb as any).mockImplementation(async (orgId: string, cb: any) => {
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
        return cb(mockTx)
      })

      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(true)
      expect(db.query.members.findFirst).toHaveBeenCalled()
      expect(withAdminTenantDb).toHaveBeenCalledWith('org-1', expect.any(Function))
    })

    it('should return false if user is not a member of the organization', async () => {
      ;(db.query.members.findFirst as any).mockResolvedValue(null)
      
      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(false)
      expect(withAdminTenantDb).not.toHaveBeenCalled()
    })

    it('should return false if the role does not have the permission', async () => {
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        roleId: 'role-viewer',
        organization: {
          tenantSchemaName: 'tenant_org_1'
        }
      })

      ;(withAdminTenantDb as any).mockImplementation(async (orgId: string, cb: any) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue(null) // No permission found
            }
          }
        }
        return cb(mockTx)
      })

      const result = await can('user-1', 'org-1', 'org:update')
      expect(result).toBe(false)
    })
  })

  describe('requirePermission()', () => {
    it('should throw a Forbidden error if permission is missing', async () => {
      // Mock 'can' returning false
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        roleId: 'role-viewer',
        organization: {
          tenantSchemaName: 'tenant_org_1'
        }
      })
      ;(withAdminTenantDb as any).mockImplementation(async (orgId: string, cb: any) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue(null)
            }
          }
        }
        return cb(mockTx)
      })

      await expect(requirePermission('user-1', 'org-1', 'org:update'))
        .rejects.toThrow('Forbidden: Missing required permission: org:update')
    })

    it('should not throw if permission is granted', async () => {
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        roleId: 'role-admin',
        organization: {
          tenantSchemaName: 'tenant_org_1'
        }
      })
      ;(withAdminTenantDb as any).mockImplementation(async (orgId: string, cb: any) => {
        const mockTx = {
          query: {
            rolePermissions: {
              findFirst: vi.fn().mockResolvedValue({ roleId: 'role-admin' })
            }
          }
        }
        return cb(mockTx)
      })

      await expect(requirePermission('user-1', 'org-1', 'org:update'))
        .resolves.not.toThrow()
    })
  })
})
