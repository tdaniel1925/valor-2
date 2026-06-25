'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  DollarSign,
  FileSignature,
  FileText,
  GraduationCap,
  LineChart,
  Network,
  Shield,
  Sparkles,
  Calculator,
  ClipboardList,
  Search,
  Building2,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  // Capability pillars — every group reflects real, shipped functionality.
  const pillars = [
    {
      icon: BarChart3,
      title: 'Book of Business',
      desc: 'Every policy and agent, synced live from SmartOffice. Cases, inforce vs. pending, premium totals, and your full org hierarchy — one source of truth.',
      points: ['SmartOffice live sync', 'Cases & policy detail', 'My Organization / downline'],
    },
    {
      icon: Calculator,
      title: 'Quoting & Illustrations',
      desc: 'Quote across every product line and run side-by-side illustrations — life, annuity, term, disability, LTC, and inforce policy reviews.',
      points: ['Income & death-benefit focused', 'Term / annuity / DI / LTC', 'WinFlex & compare illustrations'],
    },
    {
      icon: FileSignature,
      title: 'Submissions & e-Apps',
      desc: 'Submit and track applications end-to-end with the carriers and tools you already use — iGo, FormsPipe, and FireLight, launched by single sign-on.',
      points: ['iGo eApplications', 'FormsPipe forms', 'FireLight SSO'],
    },
    {
      icon: FileText,
      title: 'Contracts & Commissions',
      desc: 'Manage carrier contracts and appointments, and track commissions across your whole book — with SureLC contracting built in.',
      points: ['Carrier contracts & appointments', 'Commission tracking', 'SureLC integration'],
    },
    {
      icon: ClipboardList,
      title: 'Underwriting',
      desc: 'Underwriting guidelines, impairment questionnaires, IntelliSheets, and XRAE risk assessment — the reference tools to place cases faster.',
      points: ['Guidelines & questionnaires', 'IntelliSheets', 'XRAE risk assessment'],
    },
    {
      icon: LineChart,
      title: 'Reports & Analytics',
      desc: 'Production, carriers, agents, executive, forecast, and goal-tracking reports — plus a custom report builder, all on your live book.',
      points: ['Production & carrier reports', 'Executive & forecast', 'Custom report builder + CSV'],
    },
  ];

  const aiTools = [
    { icon: Sparkles, name: 'AI Assistant', desc: 'Chat over your entire book — top producers, premium, pending, anything.' },
    { icon: Search, name: 'Smart Search', desc: 'Natural-language policy search that just understands what you mean.' },
    { icon: DollarSign, name: 'Revenue Intelligence', desc: 'Surfaces stalled deals, missing premium, and concentration risk.' },
    { icon: Network, name: 'Cross-Sell', desc: 'Finds advisors concentrated in one product who could sell adjacent ones.' },
    { icon: Shield, name: 'Anomalies', desc: 'Flags decline clusters, pending backlogs, and unusual activity.' },
    { icon: GraduationCap, name: 'Agent Coach', desc: 'A practical coaching plan for any advisor from their book.' },
    { icon: Building2, name: 'Carrier Intelligence', desc: 'Where your premium concentrates and which carriers to grow.' },
    { icon: BarChart3, name: 'Benchmarking', desc: 'Compare an advisor against the team on premium and diversity.' },
  ];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50">
          <div className="w-full px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Valor</span>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
                <a href="#platform" className="hover:text-gray-900 dark:hover:text-white transition-colors">Platform</a>
                <a href="#ai" className="hover:text-gray-900 dark:hover:text-white transition-colors">AI Tools</a>
                <a href="#pricing" className="hover:text-gray-900 dark:hover:text-white transition-colors">Pricing</a>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {darkMode ? (
                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                  )}
                </button>
                <Link href="/login" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
                <Link href="/join" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Sign Up</Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-6">
          <div className="w-full max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm mb-6">
              <Sparkles className="h-4 w-4" />
              The complete platform for insurance professionals
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Your whole agency,
              <br />
              <span className="text-blue-600 dark:text-blue-400">in one place</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-3xl mx-auto">
              Quote, illustrate, submit, contract, and track commissions across every carrier — on a live book of business synced from SmartOffice, with AI that actually understands your data.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/join" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                Sign Up <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-700 rounded-lg">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Platform pillars */}
        <section id="platform" className="py-20 px-6 bg-white dark:bg-gray-800">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Everything an agency runs on</h2>
              <p className="text-gray-600 dark:text-gray-400">Six pillars, one connected platform.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pillars.map((p) => (
                <div key={p.title} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    <p.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{p.desc}</p>
                  <ul className="space-y-1.5">
                    {p.points.map((pt) => (
                      <li key={pt} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" /> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Tools */}
        <section id="ai" className="py-20 px-6">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full text-sm mb-4">
                <Brain className="h-4 w-4" /> AI Tools
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">An AI layer over your book of business</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                A ChatGPT-style assistant with memory, plus eleven focused tools that read your real data — not generic chat.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {aiTools.map((t) => (
                <div key={t.name} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              …and more: Meeting Prep, Report Builder, and Smart Emails.
            </p>
          </div>
        </section>

        {/* Learning + Org management */}
        <section className="py-20 px-6 bg-white dark:bg-gray-800">
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Learning Center</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Build courses with a no-skip video player, gate content by role or agent, and track completion with reports and CSV export. Onboard and certify your whole team in one place.
              </p>
            </div>
            <div className="p-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
              <Network className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Agency Administration</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Manage users, organizations, roles & permissions, integrations, and audit logs. Multi-tenant by design, with security and access control built in.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6">
          <div className="w-full max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Simple pricing</h2>
              <p className="text-gray-600 dark:text-gray-400">Start as an agent, or bring your whole agency.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Agent</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Join your agency</div>
                <ul className="space-y-3 mb-6">
                  {['Your live book of business', 'Quoting, illustrations & submissions', 'Commissions & contracts', 'Full AI Tools suite'].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/join" className="block text-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Sign Up</Link>
              </div>
              <div className="p-6 border-2 border-blue-600 dark:border-blue-500 rounded-xl relative bg-white dark:bg-gray-800">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">Popular</div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Agency</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">$149<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span></div>
                <ul className="space-y-3 mb-6">
                  {['Everything in Agent', 'Your own branded workspace', 'Team & downline management', 'Reports, learning & admin'].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Register Agency</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-6 bg-white dark:bg-gray-800">
          <div className="w-full max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Ready to get started?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">Join the insurance professionals running their business on Valor.</p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/join" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                Sign Up <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/help/contact" className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Talk to sales</Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-700">
          <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">Valor</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/help/quick-start" className="hover:text-gray-900 dark:hover:text-white transition-colors">Quick Start</Link>
              <Link href="/help" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</Link>
              <Link href="/help/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">Contact</Link>
              <Link href="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">Sign In</Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">© {2026} Valor Financial Specialists</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
