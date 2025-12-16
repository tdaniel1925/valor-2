'use client';

import { use, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Edit,
  Download,
  Send,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building,
  Shield,
  TrendingUp,
  History,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

interface Quote {
  id: string;
  quoteNumber: string;
  status: 'draft' | 'pending' | 'approved' | 'declined' | 'expired';
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    age: number;
    gender: 'Male' | 'Female';
    smoker: boolean;
  };
  policy: {
    type: 'Term Life' | 'Whole Life' | 'Universal Life';
    carrier: string;
    carrierRating: string;
    productName: string;
    coverageAmount: number;
    term?: number;
    monthlyPremium: number;
    annualPremium: number;
  };
  agent: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  notes?: string;
}

interface Activity {
  id: string;
  type: 'created' | 'updated' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired';
  description: string;
  timestamp: string;
  user?: string;
}

// Sample quote data
const sampleQuote: Quote = {
  id: '1',
  quoteNumber: 'Q-2024-001234',
  status: 'approved',
  client: {
    id: 'c1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1985-06-15',
    age: 39,
    gender: 'Male',
    smoker: false,
  },
  policy: {
    type: 'Term Life',
    carrier: 'Protective Life',
    carrierRating: 'A+',
    productName: 'Protective Classic Choice Term 20',
    coverageAmount: 500000,
    term: 20,
    monthlyPremium: 33,
    annualPremium: 395,
  },
  agent: {
    id: 'a1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@agency.com',
    phone: '(555) 987-6543',
  },
  createdAt: '2024-03-15T10:30:00Z',
  updatedAt: '2024-03-16T14:20:00Z',
  expiresAt: '2024-04-15T23:59:59Z',
  notes: 'Client is interested in adding accidental death benefit rider. Follow up scheduled for next week.',
};

const sampleActivity: Activity[] = [
  {
    id: '1',
    type: 'created',
    description: 'Quote created',
    timestamp: '2024-03-15T10:30:00Z',
    user: 'Sarah Johnson',
  },
  {
    id: '2',
    type: 'updated',
    description: 'Coverage amount increased from $250,000 to $500,000',
    timestamp: '2024-03-15T14:45:00Z',
    user: 'Sarah Johnson',
  },
  {
    id: '3',
    type: 'sent',
    description: 'Quote sent to client via email',
    timestamp: '2024-03-15T15:00:00Z',
    user: 'Sarah Johnson',
  },
  {
    id: '4',
    type: 'viewed',
    description: 'Client viewed quote',
    timestamp: '2024-03-16T09:15:00Z',
  },
  {
    id: '5',
    type: 'approved',
    description: 'Quote approved by client',
    timestamp: '2024-03-16T14:20:00Z',
  },
];

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.id;
  const [quote] = useState<Quote>(sampleQuote);
  const [activities] = useState<Activity[]>(sampleActivity);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'declined':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <FileText className="h-4 w-4" />;
      case 'updated':
        return <Edit className="h-4 w-4" />;
      case 'sent':
        return <Send className="h-4 w-4" />;
      case 'viewed':
        return <User className="h-4 w-4" />;
      case 'approved':
        return <TrendingUp className="h-4 w-4" />;
      case 'declined':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/quotes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Quotes
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {quote.quoteNumber}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Created {new Date(quote.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(quote.status)}>
                {quote.status.toUpperCase()}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button size="sm" asChild>
                <Link href={`/quotes/${quoteId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quote
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Quote Details</TabsTrigger>
            <TabsTrigger value="client">Client Info</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Quote Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Policy Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Policy Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Policy Type
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.policy.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Carrier
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {quote.policy.carrier} ({quote.policy.carrierRating})
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Product Name
                    </label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.policy.productName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Coverage Amount
                    </label>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${quote.policy.coverageAmount.toLocaleString()}
                    </p>
                  </div>
                  {quote.policy.term && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Term Length
                      </label>
                      <p className="text-gray-900 dark:text-gray-100">{quote.policy.term} years</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Premium Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Premium Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Monthly Premium
                    </label>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ${quote.policy.monthlyPremium}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Annual Premium
                    </label>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      ${quote.policy.annualPremium.toLocaleString()}
                    </p>
                  </div>
                  {quote.policy.term && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Total Premium ({quote.policy.term} years)
                      </label>
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        ${(quote.policy.annualPremium * quote.policy.term).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Agent Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-600" />
                    Agent Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.agent.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.agent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.agent.phone}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quote Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Quote Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Created</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Last Updated</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(quote.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expires</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(quote.expiresAt).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">{quote.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Client Info Tab */}
          <TabsContent value="client">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Client Information
                </CardTitle>
                <CardDescription>Personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{quote.client.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.client.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.client.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Date of Birth</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(quote.client.dateOfBirth).toLocaleDateString()} (Age {quote.client.age})
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.client.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Smoker Status</label>
                    <p className="text-gray-900 dark:text-gray-100">{quote.client.smoker ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-600" />
                  Activity History
                </CardTitle>
                <CardDescription>Timeline of all actions on this quote</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900">
                          {getActivityIcon(activity.type)}
                        </div>
                        {index < activities.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 dark:bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          {activity.user && (
                            <>
                              <span>•</span>
                              <span>{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
