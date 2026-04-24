import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteProjectAction } from '../projects'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth/rbac-utils'
import { getTenantDb } from '@/lib/db/tenant-db'

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
      ;(auth.api.getSession as any).mockResolvedValue(null)
      
      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')
      expect(result).toEqual({ success: false, error: 'Sessão expirada. Faça login novamente.' })
    })

    it('should enforce RBAC before deletion', async () => {
      ;(auth.api.getSession as any).mockResolvedValue({ user: { id: 'user-1' } })
      // requirePermission throws if denied, but our action now catches and returns it
      ;(requirePermission as any).mockRejectedValue(new Error('Forbidden: Missing required permission'))

      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')
      expect(requirePermission).toHaveBeenCalledWith('user-1', 'org-1', 'projects:delete')
      expect(getTenantDb).not.toHaveBeenCalled()
    })

    it('should successfully delete project when permitted', async () => {
      ;(auth.api.getSession as any).mockResolvedValue({ user: { id: 'user-1' } })
      ;(requirePermission as any).mockResolvedValue(true)
      
      const mockTenantDb = {
        delete: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      }
      ;(getTenantDb as any).mockImplementation(async (uid: any, oid: any, cb: any) => cb(mockTenantDb))

      const result = await deleteProjectAction('proj-1', 'org-1', 'org-slug')

      expect(result.success).toBe(true)
      expect(mockTenantDb.delete).toHaveBeenCalled()
      expect(getTenantDb).toHaveBeenCalledWith('user-1', 'org-1', expect.any(Function))
    })
  })
})
