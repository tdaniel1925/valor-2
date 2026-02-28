export const RESERVED_SLUGS = [
  "admin",
  "api",
  "www",
  "app",
  "mail",
  "email",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "marketing",
  "sales",
  "billing",
  "account",
  "dashboard",
  "portal",
  "login",
  "signup",
  "auth",
];

export function isValidSlug(slug: string): boolean {
  // Length check
  if (slug.length < 3 || slug.length > 50) {
    return false;
  }

  // Format check: lowercase alphanumeric + hyphens only
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return false;
  }

  // Cannot start or end with hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return false;
  }

  // No consecutive hyphens
  if (slug.includes("--")) {
    return false;
  }

  // Not reserved
  if (RESERVED_SLUGS.includes(slug)) {
    return false;
  }

  return true;
}

export function formatSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace invalid chars with hyphen
    .replace(/--+/g, "-") // Remove consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
