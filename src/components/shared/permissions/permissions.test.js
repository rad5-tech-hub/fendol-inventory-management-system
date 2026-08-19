import {
  extractUserTypes,
  hasPermission,
  normaliseRoleType,
  canRead,
  canCreate,
  canUpdate,
  canDelete,
  getAllowedRoles,
  ROLE_TYPES,
  ROLES,
} from './permissions'

describe('normaliseRoleType', () => {
  it('returns the same type when no alias exists', () => {
    expect(normaliseRoleType('super_admin')).toBe('super_admin')
    expect(normaliseRoleType('farm_manager')).toBe('farm_manager')
    expect(normaliseRoleType('store_keeper')).toBe('store_keeper')
  })

  it('corrects known backend typo farm_manger -> farm_manager', () => {
    expect(normaliseRoleType('farm_manger')).toBe('farm_manager')
  })

  it('returns unknown types unchanged', () => {
    expect(normaliseRoleType('unknown_role')).toBe('unknown_role')
  })
})

describe('extractUserTypes', () => {
  it('returns empty array for null/undefined', () => {
    expect(extractUserTypes(null)).toEqual([])
    expect(extractUserTypes(undefined)).toEqual([])
  })

  it('extracts types from roles array (new structure)', () => {
    const decoded = {
      roles: [
        { id: '1', type: 'super_admin' },
        { id: '2', type: 'farm_manager' },
      ],
    }
    expect(extractUserTypes(decoded)).toEqual(['super_admin', 'farm_manager'])
  })

  it('normalises role types during extraction', () => {
    const decoded = {
      roles: [{ id: '1', type: 'farm_manger' }],
    }
    expect(extractUserTypes(decoded)).toEqual(['farm_manager'])
  })

  it('falls back to top-level role field when roles is empty', () => {
    const decoded = { roles: [], role: 'admin' }
    expect(extractUserTypes(decoded)).toEqual(['admin'])
  })

  it('falls back to top-level role field when roles is missing', () => {
    const decoded = { role: 'store_keeper' }
    expect(extractUserTypes(decoded)).toEqual(['store_keeper'])
  })

  it('falls back to isSuperAdmin flag when no roles or role field', () => {
    const decoded = { isSuperAdmin: true }
    expect(extractUserTypes(decoded)).toEqual(['super_admin'])
  })

  it('returns empty array when no matching data exists', () => {
    expect(extractUserTypes({})).toEqual([])
    expect(extractUserTypes({ roles: [] })).toEqual([])
  })

  it('handles malformed roles entries gracefully', () => {
    const decoded = { roles: [{ id: '1' }] }
    expect(extractUserTypes(decoded)).toEqual([])
  })
})

describe('hasPermission', () => {
  it('returns false for empty or non-array userTypes', () => {
    expect(hasPermission([], 'dashboard')).toBe(false)
    expect(hasPermission(null, 'dashboard')).toBe(false)
    expect(hasPermission(undefined, 'dashboard')).toBe(false)
  })

  it('returns true when user type has access to resource', () => {
    expect(hasPermission(['super_admin'], 'admin')).toBe(true)
    expect(hasPermission(['farm_manager'], 'hatchery')).toBe(true)
    expect(hasPermission(['store_keeper'], 'store')).toBe(true)
    expect(hasPermission(['farm_manager'], 'showcase')).toBe(true)
    expect(hasPermission(['sales_manager'], 'finance:add-sales')).toBe(true)
    expect(hasPermission(['sales_manager'], 'finance:add-expenses')).toBe(true)
    expect(hasPermission(['sales_manager'], 'finance:cash-drawer')).toBe(true)
    expect(hasPermission(['sales_manager'], 'supplier')).toBe(false)
    expect(hasPermission(['sales_manager'], 'complaints')).toBe(false)
    expect(hasPermission(['sales_manager'], 'customer')).toBe(true)
  })

  it('returns false when user type does not have access', () => {
    expect(hasPermission(['store_keeper'], 'admin')).toBe(false)
    expect(hasPermission(['finance'], 'admin')).toBe(false)
    expect(hasPermission(['sales_manager'], 'ponds')).toBe(false)
    expect(hasPermission(['sales_manager'], 'finance:ledger')).toBe(false)
    expect(hasPermission(['super_admin'], 'supplier')).toBe(true)
    expect(hasPermission(['farm_manager'], 'supplier')).toBe(true)
    expect(hasPermission(['farm_manager'], 'complaints')).toBe(true)
    expect(hasPermission(['finance'], 'supplier')).toBe(true)
    expect(hasPermission(['farm_manager'], 'referral')).toBe(false)
    expect(hasPermission(['farm_manager'], 'mlm')).toBe(false)
  })

  it('checks scoped resources with action', () => {
    expect(hasPermission(['super_admin'], 'admin', 'create')).toBe(true)
    expect(hasPermission(['farm_manager'], 'admin', 'create')).toBe(false)
  })

  it('returns false for unknown resource keys', () => {
    expect(hasPermission(['super_admin'], 'nonexistent')).toBe(false)
  })

  it('grants access if ANY user type has permission (union)', () => {
    expect(hasPermission(['store_keeper', 'super_admin'], 'admin')).toBe(true)
    expect(hasPermission(['store_keeper', 'farm_manager'], 'hatchery')).toBe(true)
    expect(hasPermission(['sales_manager', 'finance'], 'finance:ledger')).toBe(false)
  })
})

describe('canRead / canCreate / canUpdate / canDelete', () => {
  it('canRead delegates to hasPermission without action', () => {
    expect(canRead(['super_admin'], 'dashboard')).toBe(true)
    expect(canRead(['store_keeper'], 'admin')).toBe(false)
  })

  it('canCreate delegates to hasPermission with create action', () => {
    expect(canCreate(['super_admin'], 'admin')).toBe(true)
    expect(canCreate(['farm_manager'], 'admin')).toBe(false)
  })

  it('canUpdate delegates to hasPermission with update action', () => {
    expect(canUpdate(['super_admin'], 'admin')).toBe(true)
    expect(canUpdate(['sales_manager'], 'admin')).toBe(false)
  })

  it('canDelete delegates to hasPermission with delete action', () => {
    expect(canDelete(['super_admin'], 'admin')).toBe(true)
    expect(canDelete(['farm_manager'], 'admin')).toBe(false)
  })
})

describe('getAllowedRoles', () => {
  it('returns allowed roles for a resource', () => {
    const allowed = getAllowedRoles('admin')
    expect(allowed).toEqual(['super_admin'])
  })

  it('returns allowed roles for a resource with action', () => {
    const allowed = getAllowedRoles('finance', 'ledger')
    expect(allowed).toEqual(['super_admin'])
  })

  it('returns empty array for unknown resource', () => {
    expect(getAllowedRoles('nonexistent')).toEqual([])
  })
})

describe('ROLE_TYPES and ROLES constants', () => {
  it('defines all expected role types', () => {
    expect(ROLE_TYPES.SUPER_ADMIN).toBe('super_admin')
    expect(ROLE_TYPES.FARM_MANAGER).toBe('farm_manager')
    expect(ROLE_TYPES.STORE_KEEPER).toBe('store_keeper')
    expect(ROLE_TYPES.SALES_MANAGER).toBe('sales_manager')
    expect(ROLE_TYPES.FINANCE).toBe('finance')
  })

  it('ROLES matches all role type values', () => {
    expect(ROLES).toEqual(['super_admin', 'farm_manager', 'store_keeper', 'sales_manager', 'finance'])
  })
})
