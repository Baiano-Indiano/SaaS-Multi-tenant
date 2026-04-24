import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTenantDb, withAdminTenantDb } from '../tenant-db'
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

describe('Tenant Database Isolation (tenant-db.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTenantDb()', () => {
    it('should isolate connection by setting search_path for valid members', async () => {
      // 1. Mock successful membership check
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        organization: {
          tenantSchemaName: 'tenant_org_1'
        }
      })

      // 2. Mock transaction execution
      const mockTx = {
        execute: vi.fn().mockResolvedValue({}),
      }
      ;(db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx))

      const mockCallback = vi.fn().mockResolvedValue('data')
      
      const result = await getTenantDb('user-1', 'org-1', mockCallback)

      expect(result).toBe('data')
      // Verify isolation command was sent
      expect(mockTx.execute).toHaveBeenCalled()
      // Verify callback was executed with the transaction object
      expect(mockCallback).toHaveBeenCalledWith(mockTx)
    })

    it('should reject access if user is not a member of the organization', async () => {
      ;(db.query.members.findFirst as any).mockResolvedValue(null)
      
      await expect(getTenantDb('user-1', 'org-1', async () => {}))
        .rejects.toThrow('Access Denied: You are not a member of this organization.')
      
      expect(db.transaction).not.toHaveBeenCalled()
    })

    it('should prevent SQL injection by validating the schema name format', async () => {
      // Malicious schema name that passed through the DB somehow
      ;(db.query.members.findFirst as any).mockResolvedValue({
        userId: 'user-1',
        organizationId: 'org-1',
        organization: {
          tenantSchemaName: 'public"; DROP TABLE users; --'
        }
      })

      await expect(getTenantDb('user-1', 'org-1', async () => {}))
        .rejects.toThrow('Invalid tenant schema name detected. Aborting.')
      
      expect(db.transaction).not.toHaveBeenCalled()
    })
  })

  describe('withAdminTenantDb()', () => {
    it('should allow administrative access to tenant data via organization ID', async () => {
      ;(db.query.organizations.findFirst as any).mockResolvedValue({
        id: 'org-1',
        tenantSchemaName: 'tenant_org_1'
      })

      const mockTx = {
        execute: vi.fn().mockResolvedValue({}),
      }
      ;(db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx))

      const result = await withAdminTenantDb('org-1', async () => 'admin-ok')

      expect(result).toBe('admin-ok')
      expect(mockTx.execute).toHaveBeenCalled()
    })

    it('should throw if the organization or its schema does not exist', async () => {
      ;(db.query.organizations.findFirst as any).mockResolvedValue(null)

      await expect(withAdminTenantDb('non-existent', async () => {}))
        .rejects.toThrow('Organization or tenant schema not found.')
    })
  })
})
