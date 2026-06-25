"use client";

// =============================================
// My Organization — shows the logged-in agent's downline + book of business.
// Scoped server-side (/api/downline): Phil & admins see all of Valor; sub-agency
// heads see their branch; individual agents see just themselves.
// =============================================

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils";
import { Badge, Card, CardContent } from "@/components/ui";
import { useBookFilter } from "@/components/layout/useBookFilter";
import AppLayout from "@/components/layout/AppLayout";

interface DownlineAgent {
  id: string; contactId: string | null; name: string; email: string | null;
  status: string | null; supervisorName: string | null; level: number;
}
interface Policy {
  id: string; policyNumber: string | null; primaryAdvisor: string | null;
  productName: string | null; carrierName: string | null; primaryInsured: string | null;
  status: string | null; type: string | null; targetAmount: number | null;
}
interface OrgResponse {
  matched: boolean; isAdmin?: boolean; rootName?: string; message?: string;
  downline: DownlineAgent[]; policies: Policy[];
  totals: { agents: number; policies: number; annualPremium: number; commissionablePremium: number } | null;
}

export default function MyOrganizationPage() {
  const bookFilter = useBookFilter();
  const { data, isLoading, error } = useQuery<OrgResponse>({
    queryKey: ["my-organization", bookFilter?.name ?? ""],
    queryFn: async () => {
      const url = bookFilter ? `/api/downline?focus=${encodeURIComponent(bookFilter.name)}` : "/api/downline";
      const res = await fetch(url);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      return res.json();
    },
  });

  const [tab, setTab] = useState<"agents" | "policies">("agents");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  // reset to first page when the list, query, or page size changes
  React.useEffect(() => { setPage(1); }, [tab, q, pageSize]);

  const agents = useMemo(() => {
    const list = data?.downline || [];
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter((a) => a.name.toLowerCase().includes(s) || (a.email || "").toLowerCase().includes(s));
  }, [data, q]);

  const policies = useMemo(() => {
    const list = data?.policies || [];
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(
      (p) =>
        (p.primaryAdvisor || "").toLowerCase().includes(s) ||
        (p.carrierName || "").toLowerCase().includes(s) ||
        (p.policyNumber || "").toLowerCase().includes(s),
    );
  }, [data, q]);

  return (
    <AppLayout>
      <div className="p-6 w-full">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">My Organization</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data?.isAdmin
              ? "Admin view — all agents and business across Valor."
              : data?.rootName
                ? `${data.rootName}'s downline and book of business.`
                : "Your downline and book of business."}
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">Loading your organization…</div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{(error as Error).message}</div>
        ) : !data?.matched ? (
          <Card><CardContent className="py-12 text-center text-slate-500">
            {data?.message || "No organization found for your account."}
          </CardContent></Card>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <Stat label="Agents" value={(data.totals?.agents ?? 0).toLocaleString()} />
              <Stat label="Policies" value={(data.totals?.policies ?? 0).toLocaleString()} />
              <Stat label="Annual Premium" value={formatCurrencyCompact(data.totals?.annualPremium ?? 0)} title={formatCurrency(data.totals?.annualPremium ?? 0)} />
              <Stat label="Commissionable Premium" value={formatCurrencyCompact(data.totals?.commissionablePremium ?? 0)} title={formatCurrency(data.totals?.commissionablePremium ?? 0)} />
            </div>

            {/* Tabs + search */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex gap-1">
                <TabBtn active={tab === "agents"} onClick={() => setTab("agents")}>Agents ({data.downline.length})</TabBtn>
                <TabBtn active={tab === "policies"} onClick={() => setTab("policies")}>Policies ({data.policies.length})</TabBtn>
              </div>
              <div className="flex items-center gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                  className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-48" />
                <span className="text-xs text-slate-500">Per page:</span>
                {[25, 50, 100].map((n) => (
                  <button key={n} onClick={() => setPageSize(n)}
                    className={`px-2 py-1 rounded border text-xs ${pageSize === n ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>{n}</button>
                ))}
              </div>
            </div>

            {tab === "agents" ? (
              <Card><CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Name</th>
                      <th className="text-left px-4 py-2 font-medium">Email</th>
                      <th className="text-left px-4 py-2 font-medium">Upline</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-center px-4 py-2 font-medium">Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.slice((page-1)*pageSize, page*pageSize).map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-900">{a.name}</td>
                        <td className="px-4 py-2 text-slate-500">{a.email || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{a.supervisorName || "—"}</td>
                        <td className="px-4 py-2"><Badge>{a.status || "—"}</Badge></td>
                        <td className="px-4 py-2 text-center text-slate-400">{a.level === 0 ? "You" : a.level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent></Card>
            ) : (
              <Card><CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Policy #</th>
                      <th className="text-left px-4 py-2 font-medium">Advisor</th>
                      <th className="text-left px-4 py-2 font-medium">Insured</th>
                      <th className="text-left px-4 py-2 font-medium">Carrier</th>
                      <th className="text-left px-4 py-2 font-medium">Product</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-right px-4 py-2 font-medium">Annual Prem.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.slice((page-1)*pageSize, page*pageSize).map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-700">{p.policyNumber || "—"}</td>
                        <td className="px-4 py-2 text-slate-700">{p.primaryAdvisor || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{p.primaryInsured || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{p.carrierName || "—"}</td>
                        <td className="px-4 py-2 text-slate-500">{p.productName || "—"}</td>
                        <td className="px-4 py-2"><Badge>{p.status || "—"}</Badge></td>
                        <td className="px-4 py-2 text-right text-slate-700">{formatCurrency(Number(p.targetAmount) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                              </CardContent></Card>
            )}

            {/* Pager */}
            {(() => {
              const total = tab === 'agents' ? agents.length : policies.length;
              const totalPages = Math.max(1, Math.ceil(total / pageSize));
              const safePage = Math.min(page, totalPages);
              const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
              const end = Math.min(safePage * pageSize, total);
              return (
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>Showing {start}–{end} of {total}</span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                        className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50">Prev</button>
                      <span>Page {safePage} of {totalPages}</span>
                      <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                        className="px-3 py-1.5 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-50">Next</button>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <Card><CardContent className="py-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1 tabular-nums whitespace-nowrap truncate" title={title ?? value}>{value}</div>
    </CardContent></Card>
  );
}
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-lg border ${active ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
      {children}
    </button>
  );
}
