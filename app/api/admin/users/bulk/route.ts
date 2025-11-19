import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";

// POST /api/admin/users/bulk - Perform bulk operations on users
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin role check from Supabase auth

    const body = await request.json();
    const { action, userIds, data } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request. Action and userIds array required." },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "updateRole":
        if (!data?.role) {
          return NextResponse.json(
            { error: "Role is required for updateRole action" },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: data.role },
        });
        break;

      case "updateStatus":
        if (!data?.status) {
          return NextResponse.json(
            { error: "Status is required for updateStatus action" },
            { status: 400 }
          );
        }
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: data.status },
        });
        break;

      case "activate":
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "ACTIVE" },
        });
        break;

      case "deactivate":
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "INACTIVE" },
        });
        break;

      case "suspend":
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { status: "SUSPENDED" },
        });
        break;

      case "delete":
        // Use deleteMany for bulk deletion
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
        break;

      case "export":
        // Fetch users for export
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          include: {
            profile: true,
            _count: {
              select: {
                cases: true,
                contracts: true,
                commissions: true,
              },
            },
          },
        });

        // Return CSV-formatted data
        const csv = convertUsersToCSV(users);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString()}.csv"`,
          },
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully performed ${action} on ${result.count} user(s)`,
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

// Helper function to convert users to CSV
function convertUsersToCSV(users: any[]): string {
  const headers = [
    "ID",
    "Email",
    "First Name",
    "Last Name",
    "Phone",
    "Role",
    "Status",
    "License Number",
    "License State",
    "Agency Name",
    "Cases Count",
    "Contracts Count",
    "Commissions Count",
    "Created At",
  ];

  const rows = users.map((user) => [
    user.id,
    user.email,
    user.firstName,
    user.lastName,
    user.phone || "",
    user.role,
    user.status,
    user.profile?.licenseNumber || "",
    user.profile?.licenseState || "",
    user.profile?.agencyName || "",
    user._count?.cases || 0,
    user._count?.contracts || 0,
    user._count?.commissions || 0,
    user.createdAt,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}
