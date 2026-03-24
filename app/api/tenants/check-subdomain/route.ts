import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");

    if (!subdomain) {
      return NextResponse.json(
        { error: "Subdomain is required" },
        { status: 400 }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { available: false, error: "Invalid subdomain format" },
        { status: 400 }
      );
    }

    // Reserved subdomains
    const reserved = [
      "www",
      "api",
      "admin",
      "app",
      "dashboard",
      "mail",
      "ftp",
      "smtp",
      "valor",
      "valorfs",
      "test",
      "staging",
      "dev",
      "localhost",
    ];

    if (reserved.includes(subdomain)) {
      return NextResponse.json({
        available: false,
        error: "This subdomain is reserved",
      });
    }

    // Check if subdomain already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: subdomain },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existingTenant,
    });
  } catch (error) {
    console.error("Error checking subdomain:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
