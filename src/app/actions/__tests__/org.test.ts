import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateOrganizationAction } from '../org'
import { auth } from '@/lib/auth'
import { can } from '@/lib/auth/rbac-utils'
import { db } from '@/lib/db'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/auth/rbac-utils', () => ({
  can: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn().mockResolvedValue({}),
}))

describe('Organization Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateOrganizationAction()', () => {
    it('should fail if the user is not authenticated', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null)
      
      const result = await updateOrganizationAction('00000000-0000-4000-a000-000000000004', 'New Name', 'new-slug')
      
      expect(result).toEqual({ 
        success: false, 
        error: 'Sessão expirada. Faça login novamente.' 
      })
    })

    it('should fail if the user lacks "org:update" permission', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ 
        user: { id: '00000000-0000-4000-a000-000000000001', twoFactorEnabled: false }, 
        session: { id: '00000000-0000-4000-a000-000000000002' } 
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(can).mockResolvedValue(false)

      const result = await updateOrganizationAction('00000000-0000-4000-a000-000000000004', 'New Name', 'new-slug')

      expect(result).toEqual({ 
        success: false, 
        error: 'Você não tem permissão para editar esta organização.' 
      })
      expect(can).toHaveBeenCalledWith('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000004', 'org:update')
    })

    it('should successfully update and log the action if permitted', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ 
        user: { id: '00000000-0000-4000-a000-000000000001', twoFactorEnabled: false }, 
        session: { id: '00000000-0000-4000-a000-000000000002' } 
      } as unknown as Awaited<ReturnType<typeof auth.api.getSession>>)
      vi.mocked(can).mockResolvedValue(true)
      const result = await updateOrganizationAction('00000000-0000-4000-a000-000000000004', 'New Name', 'new-slug')

      expect(result.success).toBe(true)
      expect(db.update).toHaveBeenCalled()
    })
  })
})
