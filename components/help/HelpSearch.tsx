"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui";
import Link from "next/link";

interface SearchResult {
  articles: Array<{
    slug: string;
    title: string;
    summary: string;
    category: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
  }>;
}

export function HelpSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/help/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.success) {
            setResults(data.data);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = () => setShowResults(false);
    if (showResults) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showResults]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <Input
          type="text"
          placeholder="Search help articles, FAQs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-10 pr-4"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showResults && results && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {results.articles.length === 0 && results.faqs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {results.articles.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Articles ({results.articles.length})
                  </div>
                  {results.articles.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/help/articles/${article.slug}`}
                      className="block px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowResults(false)}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {article.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {article.summary}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {article.category.replace(/_/g, " ")}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {results.faqs.length > 0 && (
                <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    FAQs ({results.faqs.length})
                  </div>
                  {results.faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {faq.question}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                        {faq.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
