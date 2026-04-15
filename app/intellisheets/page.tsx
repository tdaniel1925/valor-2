"use client";

import React, { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

interface SheetData {
  headers: string[];
  data: Record<string, any>[];
}

type IntellisheetsData = Record<string, SheetData>;

// Categorize sheets for better navigation
const SHEET_CATEGORIES = {
  "Sales & Processing": [
    "1035 Procedures",
    "1035 with Loan Carryover",
    "AMS   Imaging",
    "Commissions",
    "Conversion Submissions",
    "Drop Tickets",
    "e-Apps",
    "e-Delivery",
    "e-Delivery FAQs",
    "e-Signature\t\t",
    "New Business Processing\t\t\t\t\t\t\t",
    "Payment",
    "Policy Dating",
  ],
  "Underwriting": [
    "Underwriting",
    "Accelerated Underwriting Sheet",
    "Aviation",
    "Blood Pressure",
    "Carrier Underwriting Manuals",
    "Cholesterol",
    "Cognitive Testing",
    "COVID - 19 Underwriting",
    "Driving History",
    "Electronic Health Records",
    "Family History",
    "Marijuana",
    "Medical Requirements Shelf Life",
    "Milliman",
    "NT Pro BNP",
    "Quick Quotes and Informals",
    "Table Shave",
    "Tobacco Use",
  ],
  "Products & Riders": [
    "Chronic Illness Rider",
    "Convertible Waiver of Premium",
    "External Term Conversion",
    "Face Amount Reductions",
    "Grace Period Protection",
    "LTC Riders",
    "Premium Caps and Death Benefit ",
    "Premium Deposit Fund",
    "Rolling Targets",
    "Term Conversion",
    "Term Conversion Language",
  ],
  "Policy Administration": [
    "Age Nearest or Age Last",
    "Chargebacks",
    "E&O Guidelines",
    "Inforce Payments",
    "Internal Replacements",
    "NY Regulation 60",
    "Policy Owner Services \t\t\t\t\t\t\t",
    "Pre-Appointment States",
    "Requirement Ordering APS Reimbu",
    "Rewritten Business Rules Intern",
  ],
  "Specialty Markets": [
    "Income Replacement Factors by A",
    "Multi-Life GI",
  ],
};

export default function IntellisheetsPage() {
  const [data, setData] = useState<IntellisheetsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Sales & Processing");
  const [selectedSheet, setSelectedSheet] = useState<string>("1035 Procedures");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [sortField, setSortField] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Load data from JSON
  useEffect(() => {
    fetch("/data/intellisheets.json")
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading IntelliSheets data:", error);
        setLoading(false);
      });
  }, []);

  // Get current sheet data
  const currentSheetData = useMemo(() => {
    if (!data || !selectedSheet) return null;
    return data[selectedSheet];
  }, [data, selectedSheet]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    if (!currentSheetData) return [];

    let filtered = currentSheetData.data.filter((row) => {
      if (!searchTerm) return true;
      return Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    // Sort if field is selected
    if (sortField && currentSheetData.headers.includes(sortField)) {
      filtered.sort((a, b) => {
        const aVal = String(a[sortField] || "").toLowerCase();
        const bVal = String(b[sortField] || "").toLowerCase();
        if (sortDirection === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [currentSheetData, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Reset to page 1 when changing sheet or search
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSheet, searchTerm]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRowExpansion = (rowIndex: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedRows(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const getPreviewText = (text: string, maxLength: number = 150) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading IntelliSheets...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Carrier IntelliSheets
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Comprehensive carrier procedures, guidelines, and requirements reference
            </p>
          </div>

          {/* Category Tabs */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="flex border-b border-gray-200 dark:border-gray-700 min-w-max">
                {Object.keys(SHEET_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedSheet(SHEET_CATEGORIES[category as keyof typeof SHEET_CATEGORIES][0]);
                    }}
                    className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      selectedCategory === category
                        ? "border-blue-600 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sheet Selection Dropdown */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Sheet
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {SHEET_CATEGORIES[selectedCategory as keyof typeof SHEET_CATEGORIES].map((sheet) => (
                  <option key={sheet} value={sheet}>
                    {sheet.trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                {/* Sheet Header & Search */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {selectedSheet.trim()}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search all fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">Rows:</label>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Showing {paginatedData.length} of {filteredData.length} rows
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                          {/* Expand column */}
                        </th>
                        {currentSheetData?.headers.map((header) => (
                          <th
                            key={header}
                            onClick={() => handleSort(header)}
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <div className="flex items-center gap-2">
                              {header}
                              {sortField === header && (
                                <span className="text-blue-600 dark:text-blue-400">
                                  {sortDirection === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {paginatedData.map((row, rowIndex) => {
                        const isExpanded = expandedRows.has(rowIndex);
                        return (
                          <React.Fragment key={rowIndex}>
                            {/* Compact Row */}
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-4">
                                <button
                                  onClick={() => toggleRowExpansion(rowIndex)}
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                  aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                >
                                  <svg
                                    className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </td>
                              {currentSheetData?.headers.map((header) => {
                                const cellValue = String(row[header] || "-");
                                const isLong = cellValue.length > 50;
                                return (
                                  <td
                                    key={header}
                                    className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 max-w-xs relative group"
                                    title={isLong ? getPreviewText(cellValue) : undefined}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="truncate">
                                        {truncateText(cellValue)}
                                      </span>
                                      {isLong && (
                                        <span className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400">
                                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </span>
                                      )}
                                    </div>
                                    {isLong && (
                                      <div className="hidden group-hover:block absolute z-10 left-0 top-full mt-1 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg max-w-md whitespace-normal">
                                        {getPreviewText(cellValue)}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                            {/* Expanded Details */}
                            {isExpanded && (
                              <tr className="bg-gray-50 dark:bg-gray-900">
                                <td colSpan={currentSheetData?.headers.length ? currentSheetData.headers.length + 1 : 1} className="px-4 py-6">
                                  <div className="max-w-4xl mx-auto">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                      Full Details
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                      {currentSheetData?.headers.map((header) => (
                                        <div key={header} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                                          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            {header}
                                          </dt>
                                          <dd className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                            {row[header] || "-"}
                                          </dd>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredData.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No results found</p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
