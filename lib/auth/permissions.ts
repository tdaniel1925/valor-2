/**
 * Permission definitions and utilities for role-based access control
 */

// Permission structure: resource:action
export const PERMISSIONS = {
  // User permissions
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  USERS_MANAGE_ROLES: "users:manage_roles",

  // Organization permissions
  ORGANIZATIONS_READ: "organizations:read",
  ORGANIZATIONS_WRITE: "organizations:write",
  ORGANIZATIONS_DELETE: "organizations:delete",
  ORGANIZATIONS_MANAGE_MEMBERS: "organizations:manage_members",

  // Case permissions
  CASES_READ: "cases:read",
  CASES_WRITE: "cases:write",
  CASES_DELETE: "cases:delete",
  CASES_APPROVE: "cases:approve",

  // Commission permissions
  COMMISSIONS_READ: "commissions:read",
  COMMISSIONS_WRITE: "commissions:write",
  COMMISSIONS_DELETE: "commissions:delete",
  COMMISSIONS_APPROVE: "commissions:approve",

  // Contract permissions
  CONTRACTS_READ: "contracts:read",
  CONTRACTS_WRITE: "contracts:write",
  CONTRACTS_DELETE: "contracts:delete",
  CONTRACTS_APPROVE: "contracts:approve",

  // Goal permissions
  GOALS_READ: "goals:read",
  GOALS_WRITE: "goals:write",
  GOALS_DELETE: "goals:delete",

  // Quote permissions
  QUOTES_READ: "quotes:read",
  QUOTES_WRITE: "quotes:write",
  QUOTES_DELETE: "quotes:delete",

  // Report permissions
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",

  // Settings permissions
  SETTINGS_MANAGE: "settings:manage",

  // Audit log permissions
  AUDIT_LOGS_VIEW: "audit:view",

  // Super admin
  ALL: "*",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with their default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [PERMISSIONS.ALL],

  MANAGER: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.ORGANIZATIONS_READ,
    PERMISSIONS.ORGANIZATIONS_WRITE,
    PERMISSIONS.ORGANIZATIONS_MANAGE_MEMBERS,
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_WRITE,
    PERMISSIONS.CASES_APPROVE,
    PERMISSIONS.COMMISSIONS_READ,
    PERMISSIONS.COMMISSIONS_WRITE,
    PERMISSIONS.COMMISSIONS_APPROVE,
    PERMISSIONS.CONTRACTS_READ,
    PERMISSIONS.CONTRACTS_WRITE,
    PERMISSIONS.CONTRACTS_APPROVE,
    PERMISSIONS.GOALS_READ,
    PERMISSIONS.GOALS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  AGENT: [
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_WRITE,
    PERMISSIONS.COMMISSIONS_READ,
    PERMISSIONS.CONTRACTS_READ,
    PERMISSIONS.GOALS_READ,
    PERMISSIONS.GOALS_WRITE,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
    PERMISSIONS.REPORTS_VIEW,
  ],

  SUPPORT: [
    PERMISSIONS.CASES_READ,
    PERMISSIONS.CASES_WRITE,
    PERMISSIONS.COMMISSIONS_READ,
    PERMISSIONS.CONTRACTS_READ,
    PERMISSIONS.QUOTES_READ,
    PERMISSIONS.QUOTES_WRITE,
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  // Check for wildcard permission
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }

  // Check for exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for resource-level wildcard (e.g., "users:*")
  const [resource] = requiredPermission.split(":");
  const resourceWildcard = `${resource}:*` as Permission;
  if (userPermissions.includes(resourceWildcard)) {
    return true;
  }

  return false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * Get permissions for a given role
 */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: string, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return hasPermission(permissions, permission);
}

/**
 * Get all permissions from multiple roles (for users with multiple roles)
 */
export function mergeRolePermissions(roles: string[]): Permission[] {
  const allPermissions = new Set<Permission>();

  roles.forEach(role => {
    const permissions = getPermissionsForRole(role);
    permissions.forEach(permission => allPermissions.add(permission));
  });

  return Array.from(allPermissions);
}

/**
 * Permission inheritance - get permissions including inherited ones from organization hierarchy
 */
export function getInheritedPermissions(
  userPermissions: Permission[],
  organizationPermissions: Permission[] = []
): Permission[] {
  const allPermissions = new Set<Permission>([...userPermissions, ...organizationPermissions]);
  return Array.from(allPermissions);
}
