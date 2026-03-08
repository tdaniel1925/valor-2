import { prisma } from '@/lib/db/prisma';

/**
 * Generate a unique random inbound email address
 * Format: 8 lowercase alphanumeric characters (a-z, 0-9)
 * Example: a7f3k2x9
 */
export async function generateInboundEmailAddress(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8;

  // Try up to 10 times to generate a unique address
  for (let attempt = 0; attempt < 10; attempt++) {
    let address = '';
    for (let i = 0; i < length; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Check uniqueness
    const existing = await prisma.tenant.findUnique({
      where: { inboundEmailAddress: address }
    });

    if (!existing) {
      return address;
    }
  }

  throw new Error('Failed to generate unique inbound email address after 10 attempts');
}
