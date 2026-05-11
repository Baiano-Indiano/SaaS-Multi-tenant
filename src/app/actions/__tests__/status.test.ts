import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  upsertStatusComponentAction, 
  deleteStatusComponentAction,
  createStatusIncidentAction,
  updateStatusIncidentAction,
  deleteStatusIncidentAction
} from '../status'
import { auth } from '@/lib/auth'
import { requirePermission } from '@/lib/auth/rbac-utils'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

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

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Status Server Actions', () => {
  const mockOrgId = '00000000-0000-4000-a000-000000000123'
  const mockUserId = '00000000-0000-4000-a000-000000000456'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: mockUserId, twoFactorEnabled: false },
      session: { 
        id: '00000000-0000-4000-a000-000000000002',
        userId: mockUserId,
        token: 'token-123',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        activeOrganizationId: mockOrgId 
      }
    })
  })

  describe('upsertStatusComponentAction()', () => {
    it('should fail if organizationId does not match active organization', async () => {
      await expect(upsertStatusComponentAction({
        organizationId: '00000000-0000-4000-a000-000000000009',
        name: 'Test Component',
        status: 'operational',
        isActive: true
      })).rejects.toThrow('Não autorizado')
    })

    it('should call requirePermission with org:update', async () => {
      await upsertStatusComponentAction({
        organizationId: mockOrgId,
        name: 'Test Component',
        status: 'operational',
        isActive: true
      })
      expect(requirePermission).toHaveBeenCalledWith(mockUserId, mockOrgId, 'org:update')
    })

    it('should insert a new component if no id is provided', async () => {
      await upsertStatusComponentAction({
        organizationId: mockOrgId,
        name: 'New Component',
        status: 'operational',
        isActive: true
      })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalled()
    })

    it('should update an existing component if id is provided', async () => {
      await upsertStatusComponentAction({
        organizationId: mockOrgId,
        id: '00000000-0000-4000-a000-000000000007',
        name: 'Updated Component',
        status: 'degraded',
        isActive: true
      })
      expect(db.update).toHaveBeenCalled()
    })
  })

  describe('deleteStatusComponentAction()', () => {
    it('should delete component and revalidate path', async () => {
      await deleteStatusComponentAction({
        organizationId: mockOrgId,
        id: '00000000-0000-4000-a000-000000000007'
      })
      expect(db.delete).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalled()
    })
  })

  describe('createStatusIncidentAction()', () => {
    it('should insert a new incident', async () => {
      await createStatusIncidentAction({
        organizationId: mockOrgId,
        title: 'Major Outage',
        description: 'Something is wrong with the servers',
        status: 'investigating',
        severity: 'critical'
      })
      expect(db.insert).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalled()
    })
  })

  describe('updateStatusIncidentAction()', () => {
    it('should update incident status', async () => {
      await updateStatusIncidentAction({
        organizationId: mockOrgId,
        id: '00000000-0000-4000-a000-000000000008',
        status: 'resolved'
      })
      expect(db.update).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalled()
    })
  })

  describe('deleteStatusIncidentAction()', () => {
    it('should delete incident', async () => {
      await deleteStatusIncidentAction({
        organizationId: mockOrgId,
        id: '00000000-0000-4000-a000-000000000008'
      })
      expect(db.delete).toHaveBeenCalled()
    })
  })
})
