import { describe, it, expect, vi, beforeEach } from 'vitest'
import { inviteMemberAction } from '../member'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth/rbac-utils'
import { getTenantDb, type TenantTransaction } from '@/lib/db/tenant-db'
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
      vi.mocked(auth.api.getSession).mockResolvedValue({ 
        user: { id: 'user-1', twoFactorEnabled: false }, 
        session: { id: 'session-1' } 
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(requirePermission).mockRejectedValue(new Error('Forbidden: Missing required permission'))

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
      vi.mocked(auth.api.getSession).mockResolvedValue({ 
        user: { id: 'user-1', twoFactorEnabled: false }, 
        session: { id: 'session-1' } 
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(requirePermission).mockResolvedValue(undefined)
      
      const mockTenantDb = {
        query: {
          organizations: { findFirst: vi.fn().mockResolvedValue({ plan: 'free' }) },
          // Mocking a full list of members for the free plan
          members: { findMany: vi.fn().mockResolvedValue(new Array(PLANS.FREE.maxMembers)) },
        }
      }
      vi.mocked(getTenantDb).mockImplementation(async (_uid: string, _oid: string, cb: (db: TenantTransaction) => Promise<unknown>) => cb(mockTenantDb as unknown as TenantTransaction))

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
      vi.mocked(auth.api.getSession).mockResolvedValue({ 
        user: { id: 'user-1', twoFactorEnabled: false }, 
        session: { id: 'session-1' } 
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(requirePermission).mockResolvedValue(undefined)
      vi.mocked(auth.api.createInvitation).mockResolvedValue({ id: 'invite-123' } as unknown as Awaited<ReturnType<typeof auth.api.createInvitation>>)
      
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
      vi.mocked(getTenantDb).mockImplementation(async (_uid: string, _oid: string, cb: (db: TenantTransaction) => Promise<unknown>) => cb(mockTenantDb as unknown as TenantTransaction))

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
