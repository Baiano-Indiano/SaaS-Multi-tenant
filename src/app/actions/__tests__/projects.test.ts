import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteProjectAction } from '../projects'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth/rbac-utils'
import { getTenantDb, type TenantTransaction } from '@/lib/db/tenant-db'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/auth/rbac-utils', () => ({
  requirePermission: vi.fn(),
}))

vi.mock('@/lib/db/tenant-db', () => ({
  getTenantDb: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/events', () => ({
  emitEvent: vi.fn().mockResolvedValue({}),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Projects Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteProjectAction()', () => {
    it('should fail if user is not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      
      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')
      expect(result).toEqual({ success: false, error: 'Sessão expirada. Faça login novamente.' })
    })

    it('should enforce RBAC before deletion', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { 
          id: 'user-1', 
          email: 'test@example.com', 
          emailVerified: true, 
          name: 'Test User', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          twoFactorEnabled: false,
          image: null 
        },
        session: { 
          id: 'session-1', 
          userId: 'user-1', 
          expiresAt: new Date(), 
          token: 'token', 
          createdAt: new Date(), 
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent'
        }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      // requirePermission throws if denied, but our action now catches and returns it
      vi.mocked(requirePermission).mockRejectedValue(new Error('Forbidden: Missing required permission'))

      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')
      expect(requirePermission).toHaveBeenCalledWith('user-1', 'org-1', 'projects:delete')
      expect(getTenantDb).not.toHaveBeenCalled()
    })

    it('should successfully delete project when permitted', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { 
          id: 'user-1', 
          email: 'test@example.com', 
          emailVerified: true, 
          name: 'Test User', 
          createdAt: new Date(), 
          updatedAt: new Date(), 
          twoFactorEnabled: false,
          image: null 
        },
        session: { 
          id: 'session-1', 
          userId: 'user-1', 
          expiresAt: new Date(), 
          token: 'token', 
          createdAt: new Date(), 
          updatedAt: new Date(),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent'
        }
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(requirePermission).mockResolvedValue(undefined)
      
      const mockTenantDb = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      }
      vi.mocked(getTenantDb).mockImplementation(async (_uid: string, _oid: string, cb: (db: TenantTransaction) => Promise<unknown>) => cb(mockTenantDb as unknown as TenantTransaction))

      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')

      expect(result.success).toBe(true)
      expect(mockTenantDb.delete).toHaveBeenCalled()
      expect(getTenantDb).toHaveBeenCalledWith('user-1', 'org-1', expect.any(Function))
    })
  })
})
