import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inviteMemberAction } from '../member'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth/rbac-utils'
import { getTenantDb } from '@/lib/db/tenant-db'
import { PLANS } from '@/lib/billing/plans'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      createInvitation: vi.fn(),
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
      invitations: { findFirst: vi.fn() },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn().mockResolvedValue({}),
}))

vi.mock('@/lib/events', () => ({
  emitEvent: vi.fn().mockResolvedValue({}),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Member Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('inviteMemberAction()', () => {
    it('should fail if user lacks "members:invite" permission', async () => {
      ;(auth.api.getSession as any).mockResolvedValue({ user: { id: 'user-1' } })
      ;(requirePermission as any).mockRejectedValue(new Error('Forbidden: Missing required permission'))

      const result = await inviteMemberAction({
        email: 'test@test.com',
        roleId: 'role-1',
        orgId: 'org-1',
        orgSlug: 'slug'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')
    })

    it('should reject invitation if organization member quota is reached', async () => {
      ;(auth.api.getSession as any).mockResolvedValue({ user: { id: 'user-1' } })
      ;(requirePermission as any).mockResolvedValue(true)
      
      const mockTenantDb = {
        query: {
          organizations: { findFirst: vi.fn().mockResolvedValue({ plan: 'free' }) },
          // Mocking a full list of members for the free plan
          members: { findMany: vi.fn().mockResolvedValue(new Array(PLANS.FREE.maxMembers)) },
        }
      }
      ;(getTenantDb as any).mockImplementation(async (uid: any, oid: any, cb: any) => cb(mockTenantDb))

      const result = await inviteMemberAction({
        email: 'new@test.com',
        roleId: 'role-1',
        orgId: 'org-1',
        orgSlug: 'slug'
      })

      expect(result).toEqual({ 
        success: false, 
        error: 'Limite de membros atingido para o seu plano.' 
      })
      expect(auth.api.createInvitation).not.toHaveBeenCalled()
    })

    it('should successfully send invitation when permitted and quota allows', async () => {
      ;(auth.api.getSession as any).mockResolvedValue({ user: { id: 'user-1' } })
      ;(requirePermission as any).mockResolvedValue(true)
      ;(auth.api.createInvitation as any).mockResolvedValue({ id: 'invite-123' })
      
      const mockTenantDb = {
        query: {
          organizations: { findFirst: vi.fn().mockResolvedValue({ plan: 'pro' }) },
          members: { findMany: vi.fn().mockResolvedValue([]) },
          roles: { findFirst: vi.fn().mockResolvedValue({ id: 'role-1', slug: 'admin' }) },
        },
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue({}),
      }
      ;(getTenantDb as any).mockImplementation(async (uid: any, oid: any, cb: any) => cb(mockTenantDb))

      const result = await inviteMemberAction({
        email: 'new@test.com',
        roleId: 'role-1',
        orgId: 'org-1',
        orgSlug: 'slug'
      })

      expect(result).toEqual({ success: true })
      expect(auth.api.createInvitation).toHaveBeenCalledWith(expect.objectContaining({
        body: {
          email: 'new@test.com',
          role: 'admin',
          organizationId: 'org-1'
        }
      }))
    })
  })
})
