'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DollarSign,
  FileText,
  LineChart,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="fixed top-0 w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">Valor</span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {darkMode ? (
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-sm mb-6">
                <Sparkles className="h-4 w-4" />
                Modern insurance platform
              </div>
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                Insurance operations,
                <br />
                <span className="text-blue-600 dark:text-blue-400">simplified</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                The platform insurance professionals use to quote, track commissions, and manage their business. Clean, fast, and built for results.
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/login"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/help"
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Learn more
                </Link>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                Free 14-day trial · No credit card required
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-8 mt-20">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active agents</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">$2.5B</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Premium tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">99.9%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">4.9★</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">User rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Smart quoting
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Generate quotes in seconds with intelligent comparison tools and carrier integrations.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Commission tracking
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Never miss a payment with automated tracking and real-time commission reports.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Real-time analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Track production and performance with live dashboards and forecasting.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Team management
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Manage hierarchies, commission splits, and permissions across your organization.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Enterprise security
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Bank-level encryption and compliance with SOC 2, HIPAA, and industry standards.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Workflow automation
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Reduce admin work by 70% with intelligent automation and integrations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Trusted by insurance professionals
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                See what agents are saying
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Transformed how I run my practice. More time with clients, less on paperwork."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">SJ</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Sarah Johnson</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Independent Agent</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Commission tracking saves me 10 hours a week. The ROI was immediate."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">MC</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Michael Chen</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Agency Principal</div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Best insurance platform I've used. Clean interface, powerful features."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">ER</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Emily Rodriguez</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Senior Agent</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-6 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose the plan that fits your business
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* Agent */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Agent</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  $49<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Unlimited quotes
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Commission tracking
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Basic reporting
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Mobile access
                  </li>
                </ul>
                <Link
                  href="/auth/login"
                  className="block text-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Start trial
                </Link>
              </div>

              {/* Agency - Popular */}
              <div className="p-6 border-2 border-blue-600 dark:border-blue-500 rounded-lg relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                  Popular
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Agency</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  $149<span className="text-lg text-gray-600 dark:text-gray-400">/mo</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Everything in Agent
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Team management
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Advanced analytics
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Priority support
                  </li>
                </ul>
                <Link
                  href="/auth/login"
                  className="block text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start trial
                </Link>
              </div>

              {/* Enterprise */}
              <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Enterprise</div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Custom</div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Everything in Agency
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Dedicated support
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Custom development
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    SLA guarantees
                  </li>
                </ul>
                <Link
                  href="/help/contact"
                  className="block text-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Contact sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of insurance professionals using Valor
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                Start free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/help/contact"
                className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-4 gap-8 mb-8">
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Product</div>
                <ul className="space-y-2">
                  <li><Link href="/help" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/training" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Training</Link></li>
                  <li><Link href="/resources" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Resources</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Company</div>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Blog</a></li>
                  <li><Link href="/community" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Community</Link></li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</div>
                <ul className="space-y-2">
                  <li><Link href="/knowledge-base" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Knowledge Base</Link></li>
                  <li><Link href="/help/quick-start" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Quick Start</Link></li>
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">API Docs</a></li>
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legal</div>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Valor</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2024 Valor Financial Specialists. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
