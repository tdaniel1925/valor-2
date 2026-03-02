import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// For Supabase connection pooling in serverless, we need to append pgbouncer=true
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If already has pgbouncer parameter, return as-is
  if (url.includes('pgbouncer=true')) return url;

  // Add pgbouncer parameter for connection pooling
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}pgbouncer=true`;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasourceUrl: getDatabaseUrl(),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
