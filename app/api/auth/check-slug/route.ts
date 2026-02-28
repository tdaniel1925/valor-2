import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isValidSlug, RESERVED_SLUGS } from "@/lib/tenants/slug-validator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug parameter required" },
        { status: 400 }
      );
    }

    // Check format
    if (!isValidSlug(slug)) {
      return NextResponse.json({
        available: false,
        reason: "Invalid format. Use 3-50 lowercase letters, numbers, and hyphens only.",
      });
    }

    // Check reserved
    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json({
        available: false,
        reason: "This subdomain is reserved.",
      });
    }

    // Check database
    const existing = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: "This subdomain is already taken.",
      });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error("Check slug error:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}
