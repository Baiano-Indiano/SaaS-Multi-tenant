import { describe, it, expect } from 'vitest'
import { PERMISSIONS, ALL_PERMISSION_KEYS, DEFAULT_ADMIN_PERMISSIONS } from '../permissions'

describe('Permissions Registry', () => {
  it('should have consistent keys and object property names', () => {
    Object.entries(PERMISSIONS).forEach(([propName, permission]) => {
      expect(propName).toBe(permission.key)
    })
  })

  it('should contain all permission keys in ALL_PERMISSION_KEYS', () => {
    const keys = Object.keys(PERMISSIONS)
    expect(ALL_PERMISSION_KEYS).toHaveLength(keys.length)
    keys.forEach(key => {
      expect(ALL_PERMISSION_KEYS).toContain(key)
    })
  })

  it('should include critical security permissions', () => {
    expect(ALL_PERMISSION_KEYS).toContain('security:manage')
    expect(ALL_PERMISSION_KEYS).toContain('roles:manage')
  })

  it('should have all permissions assigned to DEFAULT_ADMIN_PERMISSIONS', () => {
    expect(DEFAULT_ADMIN_PERMISSIONS).toHaveLength(ALL_PERMISSION_KEYS.length)
  })
})
