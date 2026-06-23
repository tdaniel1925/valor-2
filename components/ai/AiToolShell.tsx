'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Sparkles } from 'lucide-react';

/** Shared chrome for AI tool pages: header, description, and a content slot. */
export default function AiToolShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-5"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="mb-6 flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        {children}
      </div>
    </AppLayout>
  );
}

export function AiError({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-red-600 dark:text-red-400">{message}</CardContent>
    </Card>
  );
}

export function AiEmpty({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">{message}</CardContent>
    </Card>
  );
}
