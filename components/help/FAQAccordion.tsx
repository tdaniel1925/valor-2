"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpfulCount?: number;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <Card
          key={faq.id}
          className="overflow-hidden transition-all duration-200 hover:shadow-md dark:hover:shadow-gray-900/70"
        >
          <CardContent className="p-0">
            <button
              onClick={() => toggleFAQ(faq.id)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <span className="font-semibold text-gray-900 dark:text-gray-100 pr-4">
                {faq.question}
              </span>
              <svg
                className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${
                  openId === faq.id ? "transform rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openId === faq.id && (
              <div className="px-6 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {faq.answer}
                </p>
                {faq.helpfulCount !== undefined && faq.helpfulCount > 0 && (
                  <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                    👍 {faq.helpfulCount} found this helpful
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
