import { describe, it, expect, vi, beforeEach } from 'vitest'
import { addDomainAction, verifyDomainAction } from '../sso'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { verifyDomainTXT } from '@/lib/sso/dns'

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

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockReturnThis(),
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
      organizationDomains: {
        findFirst: vi.fn(),
      },
      ssoConfigs: {
        findFirst: vi.fn(),
      }
    },
  },
}))

vi.mock('@/lib/sso/dns', () => ({
  verifyDomainTXT: vi.fn(),
  normalizeDomain: vi.fn((d) => d.toLowerCase().trim()),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('SSO Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addDomainAction()', () => {
    it('should fail if user is not authorized for the organization', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', twoFactorEnabled: false },
        session: { 
          id: 's1', userId: 'u1', token: 't1', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
          activeOrganizationId: 'other-org' 
        }
      })

      await expect(addDomainAction('org-1', 'example.com')).rejects.toThrow('Unauthorized')
    })

    it('should successfully add a domain and return verification token', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', twoFactorEnabled: false },
        session: { 
          id: 's1', userId: 'u1', token: 't1', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
          activeOrganizationId: 'org-1' 
        }
      })
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({ 
        id: 'org-1', 
        slug: 'org-slug',
        name: 'Org 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        logo: null,
        tenantSchemaName: 'org_1',
        plan: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        customDomain: null,
        domainVerified: false,
        verificationToken: null,
        require2FA: false
      })

      const result = await addDomainAction('org-1', 'Example.com ')

      expect(result.success).toBe(true)
      expect(result.verificationToken).toBeDefined()
      expect(db.insert).toHaveBeenCalled()
    })
  })

  describe('verifyDomainAction()', () => {
    it('should verify domain if TXT record matches', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', twoFactorEnabled: false },
        session: { 
          id: 's1', userId: 'u1', token: 't1', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
          activeOrganizationId: 'org-1' 
        }
      })
      vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue({
        id: 'dom-1',
        domain: 'example.com',
        verificationToken: 'token-123',
        organizationId: 'org-1',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      vi.mocked(db.query.organizations.findFirst).mockResolvedValue({ 
        id: 'org-1', 
        slug: 'org-slug',
        name: 'Org 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: null,
        logo: null,
        tenantSchemaName: 'org_1',
        plan: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        customDomain: null,
        domainVerified: false,
        verificationToken: null,
        require2FA: false
      })
      vi.mocked(verifyDomainTXT).mockResolvedValue(true)

      const result = await verifyDomainAction('org-1', 'dom-1')

      expect(result.success).toBe(true)
      expect(db.update).toHaveBeenCalled()
    })

    it('should return success false if TXT record does not match', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({
        user: { id: 'user-1', twoFactorEnabled: false },
        session: { 
          id: 's1', userId: 'u1', token: 't1', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
          activeOrganizationId: 'org-1' 
        }
      })
      vi.mocked(db.query.organizationDomains.findFirst).mockResolvedValue({
        id: 'dom-1',
        domain: 'example.com',
        verificationToken: 'token-123',
        organizationId: 'org-1',
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      vi.mocked(verifyDomainTXT).mockResolvedValue(false)

      const result = await verifyDomainAction('org-1', 'dom-1')

      expect(result.success).toBe(false)
      expect(db.update).not.toHaveBeenCalled()
    })
  })
})
