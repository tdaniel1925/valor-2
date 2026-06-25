import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/server-auth";
import { getTenantFromRequest } from "@/lib/auth/get-tenant-context";
import { getOrgForEmail, findAgentsByEmail } from "@/lib/downline/service";

const ADMIN_ROLES = ["ADMINISTRATOR", "EXECUTIVE"];

/**
 * GET /api/dashboard - Get dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication and get user ID from session
    const user = await requireAuth(request);
    const userId = user.id;
    const tenant = getTenantFromRequest(request);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Fetch data in parallel
    const [
      userInfo,
      casesCount,
      commissionsSum,
      contractsCount,
      quotesCount,
      casesByStatus,
      commissionsByStatus,
      mtdCommissions,
      mtdCases,
      qtdCommissions,
      qtdCases,
      ytdCommissions,
      ytdCases,
      recentCases,
      recentCommissions,
      notifications,
      book,
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true, lastName: true },
      }),
      // Stats
      prisma.case.count({ where: { userId } }),
      prisma.commission.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.contract.count({ where: { userId } }),
      prisma.quote.count({ where: { userId } }),
      // Cases by status
      prisma.case.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      // Commissions by status
      prisma.commission.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
        _sum: { amount: true },
      }),
      // MTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: monthStart } },
      }),
      // QTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: quarterStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: quarterStart } },
      }),
      // YTD
      prisma.commission.aggregate({
        where: { userId, createdAt: { gte: yearStart } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.case.count({
        where: { userId, createdAt: { gte: yearStart } },
      }),
      // Recent activity
      prisma.case.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          clientName: true,
          carrier: true,
          productType: true,
          status: true,
          premium: true,
          createdAt: true,
        },
      }),
      prisma.commission.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          type: true,
          status: true,
          carrier: true,
          amount: true,
          paidAt: true,
          createdAt: true,
        },
      }),
      // Notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      // SmartOffice book of business — the SINGLE SOURCE OF TRUTH for the
      // headline cards. Uses the SAME getOrgForEmail() that My Organization
      // uses, scoped to this user (downline) so the totals match across pages.
      (async () => {
        const EMPTY = {
          totals: { agents: 0, policies: 0, annualPremium: 0, commissionablePremium: 0, inforce: 0, pending: 0 },
          production: { mtd: 0, qtd: 0, ytd: 0, mtdPolicies: 0, qtdPolicies: 0, ytdPolicies: 0 },
          personalYtd: null as number | null,
          personalYtdPolicies: null as number | null,
        };
        if (!tenant) return null;
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true, role: true },
        });
        const email = dbUser?.email || "";
        const isAdmin = !!dbUser && ADMIN_ROLES.includes(dbUser.role);
        if (!email && !isAdmin) return EMPTY;
        try {
          const org = await getOrgForEmail(tenant.tenantId, email, { isAdmin });
          const totals = org.totals ?? EMPTY.totals;
          // Period production from the SAME book policies, by statusDate.
          // "Production" = commissionable annualized premium (commAnnualizedPrem).
          const policies = (org.policies ?? []) as Array<{ statusDate?: Date | string | null; commAnnualizedPrem?: number | null; status?: string | null }>;
          const bucket = (s: string | null | undefined) => {
            const v = (s || '').toLowerCase();
            if (v.includes('inforce') || v.includes('issued') || v.includes('approved')) return 'INFORCE';
            if (v.includes('pending') || v.includes('submitted') || v.includes('await') || v.includes('incomplete')) return 'PENDING';
            return 'OTHER';
          };
          const inforceCount = policies.filter((p) => bucket(p.status) === 'INFORCE').length;
          const pendingCount = policies.filter((p) => bucket(p.status) === 'PENDING').length;
          const inPeriod = (since: Date) =>
            policies.filter((p) => {
              const d = p.statusDate ? new Date(p.statusDate) : null;
              return d && d >= since;
            });
          const sum = (arr: typeof policies) => arr.reduce((s, p) => s + (Number(p.commAnnualizedPrem) || 0), 0);
          const mtdP = inPeriod(monthStart);
          const qtdP = inPeriod(quarterStart);
          const ytdP = inPeriod(yearStart);

          // PERSONAL production = only policies the logged-in user wrote
          // themselves (primaryAdvisor matches their own advisor name), NOT
          // their whole downline. This is what the promotion meter uses, since
          // promotion targets are per-agent. null when the user has no own book.
          const myAgents = await findAgentsByEmail(tenant.tenantId, email);
          const myNames = new Set(
            myAgents.map((a) => (a.fullName || "").trim().toLowerCase()).filter(Boolean)
          );
          const ownPolicies = (org.policies ?? []) as Array<{
            statusDate?: Date | string | null;
            commAnnualizedPrem?: number | null;
            primaryAdvisor?: string | null;
          }>;
          const mine = myNames.size
            ? ownPolicies.filter((p) => myNames.has((p.primaryAdvisor || "").trim().toLowerCase()))
            : [];
          const mineYtd = mine.filter((p) => {
            const d = p.statusDate ? new Date(p.statusDate) : null;
            return d && d >= yearStart;
          });
          const personalYtd = mineYtd.reduce((s, p) => s + (Number(p.commAnnualizedPrem) || 0), 0);

          return {
            totals: { ...totals, inforce: inforceCount, pending: pendingCount },
            production: {
              mtd: sum(mtdP),
              qtd: sum(qtdP),
              ytd: sum(ytdP),
              mtdPolicies: mtdP.length,
              qtdPolicies: qtdP.length,
              ytdPolicies: ytdP.length,
            },
            // null when the user has no personal book (admins/managers without
            // their own writing record) → meter hides for them.
            personalYtd: myNames.size ? personalYtd : null,
            personalYtdPolicies: myNames.size ? mineYtd.length : null,
          };
        } catch {
          return EMPTY;
        }
      })(),
    ]);

    const response = NextResponse.json({
      success: true,
      data: {
        user: userInfo || { email: "", firstName: "Demo", lastName: "User" },
        // SmartOffice book-of-business (single source of truth; matches My
        // Organization + Cases). `totals` = book size; `production` = period
        // commissionable premium by statusDate. Null only when no tenant.
        book: book
          ? {
              agents: book.totals.agents ?? 0,
              policies: book.totals.policies ?? 0,
              annualPremium: book.totals.annualPremium ?? 0,
              commissionablePremium: book.totals.commissionablePremium ?? 0,
              inforce: (book.totals as { inforce?: number }).inforce ?? 0,
              pending: (book.totals as { pending?: number }).pending ?? 0,
              production: book.production,
              personalYtd: book.personalYtd ?? null,
              personalYtdPolicies: book.personalYtdPolicies ?? null,
            }
          : null,
        stats: {
          casesTotal: casesCount,
          commissionsTotal: commissionsSum._sum.amount || 0,
          contractsTotal: contractsCount,
          quotesTotal: quotesCount,
          casesByStatus: casesByStatus.map((s) => ({
            status: s.status,
            _count: s._count,
          })),
          commissionsByStatus: commissionsByStatus.map((s) => ({
            status: s.status,
            _count: s._count,
            _sum: { amount: s._sum.amount || 0 },
          })),
        },
        periodSummaries: {
          mtd: {
            commissions: mtdCommissions._sum.amount || 0,
            commissionsCount: mtdCommissions._count,
            cases: mtdCases,
          },
          qtd: {
            commissions: qtdCommissions._sum.amount || 0,
            commissionsCount: qtdCommissions._count,
            cases: qtdCases,
          },
          ytd: {
            commissions: ytdCommissions._sum.amount || 0,
            commissionsCount: ytdCommissions._count,
            cases: ytdCases,
          },
        },
        recentActivity: {
          cases: recentCases,
          commissions: recentCommissions,
        },
        notifications: notifications.map((n) => ({
          ...n,
          isNew: !n.isRead,
        })),
      },
    });

    // Add caching headers (cache for 30 seconds)
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error: any) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
