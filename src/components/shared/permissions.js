/**
 * ── RBAC Permission Matrix ──────────────────────────────────────────
 *
 * Roles (stored in sessionStorage as 'role'):
 *   super_admin   – MD / Managing Director (full access)
 *   farm_manager  – Everything except admin/site CRUD + no Finance Ledger
 *   store_keeper  – Store, Feed, Showcase (+ Sales if main-site assigned)
 *   sales_manager – Customer / CRM, Sales-related features only
 *   finance       – All finance modules (excl. ledger) + Supplier menu
 *
 * Usage:
 *   hasAccess(role, resource)        → boolean
 *   hasAccess(role, resource, action) → boolean  (for CRUD-gated resources)
 */

// ――― Resource-level access ―――
// Key = resource name, value = array of roles that can access it.
// Resources that distinguish create/update/delete from read use
// a colon suffix (e.g. 'admin:create').
const ACCESS = {
  // ── Dashboard ──
  dashboard:               ['super_admin', 'farm_manager'],

  // ── Admin ──
  admin:                    ['super_admin', 'farm_manager'],
  'admin:create':           ['super_admin'],
  'admin:update':           ['super_admin'],
  'admin:delete':           ['super_admin'],

  // ── Customer / CRM ──
  customer:                 ['super_admin', 'farm_manager', 'sales_manager'],

  // ── Ponds ──
  ponds:                    ['super_admin', 'farm_manager'],

  // ── Manage Fish ──
  'manage-fish':            ['super_admin', 'farm_manager'],

  // ── Fish Processing ──
  'fish-processes':         ['super_admin', 'farm_manager'],

  // ── Products ──
  products:                 ['super_admin', 'farm_manager'],
  'products:assign-site':   ['super_admin'],

  // ── Showcase ──
  showcase:                 ['super_admin', 'farm_manager', 'store_keeper'],

  // ── Site Management ──
  'site-management':        ['super_admin', 'farm_manager'],
  'site-management:create': ['super_admin'],
  'site-management:update': ['super_admin'],
  'site-management:delete': ['super_admin'],

  // ── Feed ──
  feed:                     ['super_admin', 'farm_manager', 'store_keeper'],

  // ── Store / Inventory ──
  store:                    ['super_admin', 'farm_manager', 'store_keeper'],

  // ── Finance ──
  'finance:add-sales':      ['super_admin', 'farm_manager', 'sales_manager', 'finance'],
  'finance:add-expenses':   ['super_admin', 'farm_manager', 'finance'],
  'finance:ledger':         ['super_admin'],
  'finance:cash-drawer':    ['super_admin', 'farm_manager', 'finance'],

  // ── Damage / Loss ──
  'damage-loss':            ['super_admin', 'farm_manager'],

  // ── Supplier ──
  supplier:                 ['super_admin', 'farm_manager', 'finance'],
};

// ――― Convenience: list every role for quick iteration ―――
export const ROLES = [
  'super_admin',
  'farm_manager',
  'store_keeper',
  'sales_manager',
  'finance',
];

/**
 * Check whether a role has access to a given resource.
 *
 * @param {string|null} role    – The user's role from sessionStorage.
 * @param {string}       resource – Resource name (e.g. 'admin', 'finance:ledger').
 * @param {string}      [action] – Optional scoped action (create/update/delete).
 *                                 If provided, looks up `${resource}:${action}`.
 * @returns {boolean}
 */
export function hasAccess(role, resource, action) {
  if (!role) return false;
  const key = action ? `${resource}:${action}` : resource;
  const allowed = ACCESS[key];
  if (!allowed) return false;
  return allowed.includes(role);
}

/**
 * Check whether a role can read a resource.
 * Syntactic sugar over hasAccess(role, resource).
 */
export function canRead(role, resource) {
  return hasAccess(role, resource);
}

/**
 * Check whether a role can create a resource.
 * Falls back to the base resource if no create-specific key exists.
 */
export function canCreate(role, resource) {
  return hasAccess(role, resource, 'create');
}

/**
 * Check whether a role can update a resource.
 */
export function canUpdate(role, resource) {
  return hasAccess(role, resource, 'update');
}

/**
 * Check whether a role can delete a resource.
 */
export function canDelete(role, resource) {
  return hasAccess(role, resource, 'delete');
}

/**
 * Return all roles that have access to a resource (useful for documentation).
 */
export function getAllowedRoles(resource, action) {
  const key = action ? `${resource}:${action}` : resource;
  return ACCESS[key] || [];
}

export default { hasAccess, canRead, canCreate, canUpdate, canDelete, getAllowedRoles, ROLES };
