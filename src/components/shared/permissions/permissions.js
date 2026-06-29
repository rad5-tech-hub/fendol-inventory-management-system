/**
 * ── RBAC Permission Matrix ──────────────────────────────────────────
 *
 * Permission is driven by roles[].type from the decoded JWT.
 * A user may have multiple role types; access is the UNION of all.
 *
 * Confirmed JWT payload shape:
 * {
 *   "roles": [{ "id": "...", "name": "Md", "type": "super_admin", "isSuperAdmin": true }],
 *   "isSuperAdmin": true,
 *   "role": "admin"   ← legacy field, ignored for permission logic
 * }
 *
 * Role types:
 *   super_admin   – MD / full access
 *   farm_manager  – Everything except admin/site CRUD + no finance:ledger
 *   store_keeper  – Store, Feed, Showcase only
 *   sales_manager – Customer, Sales-related finance, Supplier
 *   finance       – Finance modules (excl. ledger) + Supplier
 */

const ACCESS = {
	// ── Dashboard (all authenticated users) ──
	dashboard: ['super_admin', 'farm_manager', 'store_keeper', 'sales_manager', 'finance'],

	// ── Hatchery ──
	hatchery: ['super_admin', 'farm_manager'],

	// ── Batch Dashboard ──
	'batch-dashboard': ['super_admin', 'farm_manager'],

	// ── Admin ──
	admin: ['super_admin'],
	'admin:create': ['super_admin'],
	'admin:update': ['super_admin'],
	'admin:delete': ['super_admin'],

	// ── Site Management ──
	'site-management': ['super_admin'],
	'site-management:create': ['super_admin'],
	'site-management:update': ['super_admin'],
	'site-management:delete': ['super_admin'],

	// ── Customer / CRM ──
	customer: ['super_admin', 'farm_manager', 'sales_manager'],

	// ── Ponds ──
	ponds: ['super_admin', 'farm_manager'],

	// ── Manage Fish ──
	'manage-fish': ['super_admin', 'farm_manager'],

	// ── Fish Processing ──
	'fish-processes': ['super_admin', 'farm_manager'],

	// ── Products ──
	products: ['super_admin', 'farm_manager'],
	'products:assign-site': ['super_admin'],

	// ── Feed ──
	feed: ['super_admin', 'farm_manager', 'store_keeper'],

	// ── Store / Inventory ──
	store: ['super_admin', 'farm_manager', 'store_keeper'],

	// ── Showcase ──
	showcase: ['super_admin', 'farm_manager', 'store_keeper'],

	// ── Finance ──
	'finance:add-sales': ['super_admin', 'farm_manager', 'sales_manager', 'finance'],
	'finance:add-expenses': ['super_admin', 'farm_manager', 'finance'],
	'finance:ledger': ['super_admin'],
	'finance:cash-drawer': ['super_admin', 'farm_manager', 'finance'],

	// ── Damage / Loss ──
	'damage-loss': ['super_admin', 'farm_manager'],

	// ── Supplier (reused under Finance) ──
	supplier: ['super_admin', 'farm_manager', 'sales_manager', 'finance'],

	// ── Staff (under Finance) ──
	staff: ['super_admin', 'farm_manager', 'finance'],

	// ── Referral System ──
	referral: ['super_admin', 'farm_manager', 'sales_manager'],

	// ── MLM ──
	mlm: ['super_admin', 'farm_manager', 'sales_manager'],

	// ── Complaints ──
	complaints: ['super_admin', 'farm_manager', 'store_keeper', 'sales_manager', 'finance'],
	'complaints:view-all': ['super_admin'],
};

export const ROLE_TYPES = {
	SUPER_ADMIN: 'super_admin',
	FARM_MANAGER: 'farm_manager',
	STORE_KEEPER: 'store_keeper',
	SALES_MANAGER: 'sales_manager',
	FINANCE: 'finance',
};

export const ROLES = Object.values(ROLE_TYPES);

/**
 * Normalise a role type string — corrects known backend typos/spellings
 * so the permission matrix can match consistently.
 */
function normaliseRoleType(type) {
	const aliases = {
		'farm_manger': 'farm_manager',   // backend typo (missing 'a')
	};
	return aliases[type] || type;
}

/**
 * Extract role type strings from the decoded JWT.
 * 
 * Tries decoded.roles[].type first (new structure).
 * Falls back to decoded.role if roles is empty (legacy/transitional structure).
 * Safe to call with null/undefined.
 *
 * @param {object} decoded - full decoded JWT payload
 * @returns {string[]}
 */
export function extractUserTypes(decoded) {
	if (!decoded) return [];

	// Try the new roles array structure
	if (Array.isArray(decoded.roles) && decoded.roles.length > 0) {
		return decoded.roles.map(r => normaliseRoleType(r.type)).filter(Boolean);
	}

	// Fallback to top-level role field (legacy or transitional)
	if (typeof decoded.role === 'string' && decoded.role) {
		return [decoded.role];
	}

	// Fallback to isSuperAdmin flag
	if (decoded.isSuperAdmin === true) {
		return ['super_admin'];
	}

	return [];
}

/**
 * Check whether a user has access to a resource.
 * Accepts an array of role types (from roles[].type in JWT).
 * Access is granted if ANY of the user's types has permission.
 *
 * @param {string[]} userTypes - e.g. ['super_admin'] or ['store_keeper', 'sales_manager']
 * @param {string}   resource  - resource key e.g. 'admin', 'finance:ledger'
 * @param {string}  [action]   - optional: 'create' | 'update' | 'delete'
 * @returns {boolean}
 */
export function hasPermission(userTypes, resource, action) {
	if (!Array.isArray(userTypes) || userTypes.length === 0) return false;
	const key = action ? `${resource}:${action}` : resource;
	const allowed = ACCESS[key];
	if (!allowed) return false;
	return userTypes.some(type => allowed.includes(type));
}

export function canRead(userTypes, resource) { return hasPermission(userTypes, resource); }
export function canCreate(userTypes, resource) { return hasPermission(userTypes, resource, 'create'); }
export function canUpdate(userTypes, resource) { return hasPermission(userTypes, resource, 'update'); }
export function canDelete(userTypes, resource) { return hasPermission(userTypes, resource, 'delete'); }
export function getAllowedRoles(resource, action) {
	const key = action ? `${resource}:${action}` : resource;
	return ACCESS[key] || [];
}

export { normaliseRoleType };

export default { hasPermission, canRead, canCreate, canUpdate, canDelete, getAllowedRoles, ROLES, ROLE_TYPES, extractUserTypes, normaliseRoleType };
