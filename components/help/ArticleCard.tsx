"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    summary: string;
    category: string;
    tags: string[];
    views?: number;
    helpfulCount?: number;
  };
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/help/articles/${article.slug}`}>
      <Card className="h-full hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {article.category.replace(/_/g, " ")}
            </span>
            {article.views !== undefined && article.views > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {article.views} views
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {article.summary}
          </p>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {article.helpfulCount !== undefined && article.helpfulCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-green-600 dark:text-green-400">
                👍 {article.helpfulCount} found this helpful
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
