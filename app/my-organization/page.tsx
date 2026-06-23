"use client";

// =============================================
// My Organization — shows the logged-in agent's downline + book of business.
// Scoped server-side (/api/downline): Phil & admins see all of Valor; sub-agency
// heads see their branch; individual agents see just themselves.
// =============================================

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { Badge, Card, CardContent } from "@/components/ui";
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
  totals: { agents: number; policies: number; annualPremium: number } | null;
}

export default function MyOrganizationPage() {
  const { data, isLoading, error } = useQuery<OrgResponse>({
    queryKey: ["my-organization"],
    queryFn: async () => {
      const res = await fetch("/api/downline");
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      return res.json();
    },
  });

  const [tab, setTab] = useState<"agents" | "policies">("agents");
  const [q, setQ] = useState("");

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
      <div className="p-6 max-w-7xl mx-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <Stat label="Agents" value={String(data.totals?.agents ?? 0)} />
              <Stat label="Policies" value={String(data.totals?.policies ?? 0)} />
              <Stat label="Annual Premium" value={formatCurrency(data.totals?.annualPremium ?? 0)} />
            </div>

            {/* Tabs + search */}
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div className="flex gap-1">
                <TabBtn active={tab === "agents"} onClick={() => setTab("agents")}>Agents ({data.downline.length})</TabBtn>
                <TabBtn active={tab === "policies"} onClick={() => setTab("policies")}>Policies ({data.policies.length})</TabBtn>
              </div>
              <input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-full max-w-xs"
              />
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
                    {agents.map((a) => (
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
                    {policies.slice(0, 500).map((p) => (
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
                {policies.length > 500 && (
                  <div className="px-4 py-2 text-xs text-slate-400">Showing first 500 of {policies.length}. Use search to narrow.</div>
                )}
              </CardContent></Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="py-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
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
