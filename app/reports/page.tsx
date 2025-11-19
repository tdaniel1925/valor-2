'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  PieChart,
  Target,
  Award,
  Building2,
  Calendar,
  Download,
  ArrowRight,
} from 'lucide-react';

const reports = [
  {
    title: 'Executive Dashboard',
    description: 'High-level business intelligence, KPIs, and strategic insights',
    icon: BarChart3,
    href: '/reports/executive',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    features: [
      'YTD vs Last Year comparison',
      'Product mix analysis',
      'Pipeline visualization',
      'Top performers',
    ],
  },
  {
    title: 'Commission Reports',
    description: 'Track commission earnings, pending payments, and historical data',
    icon: DollarSign,
    href: '/reports/commissions',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    features: [
      'Pending vs paid breakdown',
      'Commission by carrier',
      '6-month trends',
      'Transaction history',
    ],
  },
  {
    title: 'Production Reports',
    description: 'Sales performance, case volume, and productivity metrics',
    icon: TrendingUp,
    href: '/reports/production',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    features: [
      'Individual & team reports',
      'Agent leaderboards',
      'Conversion rates',
      'Product performance',
    ],
  },
  {
    title: 'Agent Analytics',
    description: 'Comprehensive agent performance metrics, rankings, and trends',
    icon: Users,
    href: '/reports/agents',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    features: [
      'Performance rankings',
      'Conversion rate tracking',
      'Persistency metrics',
      'Product mix analysis',
    ],
  },
  {
    title: 'Carrier Analysis',
    description: 'Carrier-specific performance, placement rates, and commission data',
    icon: Building2,
    href: '/reports/carriers',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    features: [
      'Market share analysis',
      'Approval rate tracking',
      'Commission comparison',
      'Underwriting time metrics',
    ],
  },
  {
    title: 'Goal Tracking',
    description: 'Monitor progress towards sales goals and performance targets',
    icon: Target,
    href: '/reports/goal-tracking',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    features: [
      'Real-time progress tracking',
      'Projected completion',
      'Daily rate requirements',
      'Achievement status',
    ],
  },
  {
    title: 'Commission Forecast',
    description: 'AI-powered commission projections based on historical trends',
    icon: Calendar,
    href: '/reports/forecast',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    features: [
      'Monthly projections',
      'Conservative & optimistic scenarios',
      'By agent & carrier forecasts',
      'Confidence levels',
    ],
  },
  {
    title: 'Custom Report Builder',
    description: 'Build custom reports with flexible filters and data visualization',
    icon: PieChart,
    href: '/reports/builder',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    features: [
      'Drag-drop interface',
      'Multiple data sources',
      'Custom filters & grouping',
      'Save & export reports',
    ],
  },
];

const quickStats = [
  {
    label: 'Available Reports',
    value: '8',
    icon: FileText,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    label: 'Export Formats',
    value: '2',
    subtext: 'Excel, CSV',
    icon: Download,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    label: 'Data Points',
    value: '100+',
    subtext: 'KPIs tracked',
    icon: Target,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    label: 'Update Frequency',
    value: 'Real-time',
    icon: Calendar,
    color: 'text-orange-600 dark:text-orange-400',
  },
];

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Comprehensive reporting suite for business intelligence and performance tracking
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">{stat.value}</p>
                      {stat.subtext && (
                        <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                      )}
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Reports Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const Icon = report.icon;
              return (
                <Card
                  key={report.title}
                  className="relative overflow-hidden transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${report.bgColor} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">{report.title}</CardTitle>
                    <CardDescription className="text-sm">{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground">Key Features:</p>
                      <ul className="space-y-1">
                        {report.features.map((feature, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className={`${report.color} mt-1`}>•</span>
                            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                      <Link href={report.href}>
                      <Button className="w-full" variant="default">
                        View Report
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Features Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Award className="h-6 w-6 text-primary" />
              Reporting Features
            </CardTitle>
            <CardDescription>
              Powerful analytics capabilities built into every report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Export Options
                </div>
                <p className="text-sm text-muted-foreground">
                  Export reports in PDF, Excel, or CSV format for easy sharing and analysis
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Flexible Date Ranges
                </div>
                <p className="text-sm text-muted-foreground">
                  View data by month, quarter, year-to-date, or custom date ranges
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Real-Time Data
                </div>
                <p className="text-sm text-muted-foreground">
                  All reports pull live data from your database for up-to-the-minute insights
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  Interactive Charts
                </div>
                <p className="text-sm text-muted-foreground">
                  Visualize data with pie charts, bar graphs, line charts, and more
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  Team & Individual Views
                </div>
                <p className="text-sm text-muted-foreground">
                  Switch between organization-wide and individual agent perspectives
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Trend Analysis
                </div>
                <p className="text-sm text-muted-foreground">
                  Track performance over time with historical comparisons and growth metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-muted dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Need Help?</CardTitle>
            <CardDescription>Learn how to make the most of your reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Our reporting suite provides comprehensive insights into your business performance.
              Each report is designed to help you make data-driven decisions and track key metrics.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Documentation
              </Button>
              <Button variant="outline" size="sm">
                Watch Tutorial
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
