"use client";

import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";

interface CatalogDocument {
  title: string;
  fileName: string;
  category: string;
}

export default function CatalogPage() {
  const [documents, setDocuments] = useState<CatalogDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof CatalogDocument>("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Load documents from public folder
  useEffect(() => {
    // Parse filenames and categorize
    const catalogDocs: CatalogDocument[] = [
      // Medical Conditions
      { title: "Acute Coronary Syndrome (ACS)", fileName: "articlesUnderwriting QuestionnairesAcute Coronary Syndrome ACS Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "ADHD (Attention Deficit Hyperactivity Disorder)", fileName: "articlesUnderwriting QuestionnairesADHD Attention Deficit Hyperactivity Disorder Impairment Guide.pdf", category: "Mental Health" },
      { title: "Adjustment Disorder", fileName: "articlesUnderwriting QuestionnairesAdjustment Disorder Impairment Guide.pdf", category: "Mental Health" },
      { title: "Albuminuria", fileName: "articlesUnderwriting QuestionnairesAlbuminuria Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Alcohol Usage", fileName: "articlesUnderwriting QuestionnairesAlcohol Usage Questionnaire.pdf", category: "Lifestyle" },
      { title: "Alcohol Use Disorder", fileName: "articlesUnderwriting QuestionnairesAlcohol Use Disorder Impairment Guide.pdf", category: "Lifestyle" },
      { title: "Alcoholic Liver Disease", fileName: "articlesUnderwriting QuestionnairesAlcoholic Liver Disease Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "All NAILBA Underwriting Questionnaires", fileName: "articlesUnderwriting QuestionnairesAll NAILBA Underwriting Questionnaires.pdf", category: "General" },
      { title: "Amputation", fileName: "articlesUnderwriting QuestionnairesAmputation Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Anemia", fileName: "articlesUnderwriting QuestionnairesAnemia Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Aneurysms and AV Malformations", fileName: "articlesUnderwriting QuestionnairesAneurysms and AV Malformations Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Angioplasty", fileName: "articlesUnderwriting QuestionnairesAngioplasty Questionnaire.pdf", category: "Medical Procedures" },
      { title: "Ankylosing Spondylitis (AS)", fileName: "articlesUnderwriting QuestionnairesAnkylosing Spondylitis AS Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Anxiety Disorders", fileName: "articlesUnderwriting QuestionnairesAnxiety Disorders Questionnaire.pdf", category: "Mental Health" },
      { title: "Arthritis", fileName: "articlesUnderwriting QuestionnairesArthritis Questionnaire.pdf", category: "Medical Conditions" },
      { title: "Asthma", fileName: "articlesUnderwriting QuestionnairesAsthma Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Atrial Fibrillation", fileName: "articlesUnderwriting QuestionnairesAtrial Fibrillation Questionnaire.pdf", category: "Cardiac" },
      { title: "Aviation", fileName: "articlesUnderwriting QuestionnairesAviation Questionnaire.pdf", category: "Occupational" },
      { title: "Avocations", fileName: "articlesUnderwriting QuestionnairesAvocations Questionnaire.pdf", category: "Lifestyle" },
      { title: "Barrett Esophagus (BA)", fileName: "articlesUnderwriting QuestionnairesBarrett Esophagus BA Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Bipolar Disorder", fileName: "articlesUnderwriting QuestionnairesBI-Polar Disorder Impairment Guide.pdf", category: "Mental Health" },
      { title: "Borderline Personality Disorder", fileName: "articlesUnderwriting QuestionnairesBodyweight Questionnaire.pdf", category: "Mental Health" },
      { title: "Bodyweight", fileName: "articlesUnderwriting QuestionnairesBodyweight Questionnaire.pdf", category: "Physical Health" },
      { title: "Breast Cancer", fileName: "articlesUnderwriting QuestionnairesBreast Cancer Impairment Guide.pdf", category: "Cancer" },
      { title: "Cardiac Arrest (Non-MI)", fileName: "articlesUnderwriting QuestionnairesCardiac Arrest Non-MI Impairment Guide.pdf", category: "Cardiac" },
      { title: "Cardiomyopathy", fileName: "articlesUnderwriting QuestionnairesCardiomyopathy Impairment Guide.pdf", category: "Cardiac" },
      { title: "Celiac Disease", fileName: "articlesUnderwriting QuestionnairesCardiomyopathy Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Cerebral Aneurysm", fileName: "articlesUnderwriting QuestionnairesCerebral Aneurysm Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Cerebral Palsy", fileName: "articlesUnderwriting QuestionnairesCerebral Palsy Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Chest Pain", fileName: "articlesUnderwriting QuestionnairesChest Pain Questionnaire.pdf", category: "Cardiac" },
      { title: "Chronic Kidney Disease", fileName: "articlesUnderwriting QuestionnairesChronic Kidney Disease Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Chronic Obstructive Pulmonary Disease (COPD)", fileName: "articlesUnderwriting QuestionnairesChronic Obstructive Pulmonary Disease COPD Impairment Guide.pdf", category: "Respiratory" },
      { title: "Cirrhosis", fileName: "articlesUnderwriting QuestionnairesCirrhosis Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Coronary Artery Bypass Graft (CABG)", fileName: "articlesUnderwriting QuestionnairesCoronary Artery Bypass Graft CABG Impairment Guide.pdf", category: "Cardiac" },
      { title: "Coronary Artery Disease (CAD)", fileName: "articlesUnderwriting QuestionnairesCoronary Artery Disease CAD Impairment Guide.pdf", category: "Cardiac" },
      { title: "Depression", fileName: "articlesUnderwriting QuestionnairesDepression Impairment Guide.pdf", category: "Mental Health" },
      { title: "Diabetes Mellitus Type 1", fileName: "articlesUnderwriting QuestionnairesDepression Impairment Guide.pdf", category: "Endocrine" },
      { title: "Diabetes Mellitus Type 2", fileName: "articlesUnderwriting QuestionnairesDiabetes Mellitus Type 2 Impairment Guide.pdf", category: "Endocrine" },
      { title: "Drug Usage", fileName: "articlesUnderwriting QuestionnairesDrug Usage Questionnaire.pdf", category: "Lifestyle" },
      { title: "Epilepsy", fileName: "articlesUnderwriting QuestionnairesEpilepsy Impairment Guide.pdf", category: "Neurological" },
      { title: "Family History", fileName: "articlesUnderwriting QuestionnairesFamily History Questionnaire.pdf", category: "General" },
      { title: "Heart Failure", fileName: "articlesUnderwriting QuestionnairesHeart Failure Impairment Guide.pdf", category: "Cardiac" },
      { title: "Hepatitis", fileName: "articlesUnderwriting QuestionnairesHepatitis Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "HIV/AIDS", fileName: "articlesUnderwriting QuestionnairesHIV-AIDS Impairment Guide.pdf", category: "Infectious Diseases" },
      { title: "Hypertension", fileName: "articlesUnderwriting QuestionnairesHypertension Impairment Guide.pdf", category: "Cardiac" },
      { title: "Inflammatory Bowel Disease (IBD)", fileName: "articlesUnderwriting QuestionnairesInflammatory Bowel Disease IBD Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Kidney Stones", fileName: "articlesUnderwriting QuestionnairesKidney Stones Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Liver Disease", fileName: "articlesUnderwriting QuestionnairesLiver Disease Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Lupus", fileName: "articlesUnderwriting QuestionnairesLupus Impairment Guide.pdf", category: "Autoimmune" },
      { title: "Melanoma", fileName: "articlesUnderwriting Questionnairesmelanoma Impairment Guide.pdf", category: "Cancer" },
      { title: "Multiple Sclerosis (MS)", fileName: "articlesUnderwriting QuestionnairesMultiple Sclerosis MS Impairment Guide.pdf", category: "Neurological" },
      { title: "Myocardial Infarction (Heart Attack)", fileName: "articlesUnderwriting QuestionnairesMyocardial Infarction Heart Attack Impairment Guide.pdf", category: "Cardiac" },
      { title: "Obesity", fileName: "articlesUnderwriting QuestionnairesObesity Impairment Guide.pdf", category: "Physical Health" },
      { title: "Obstructive Sleep Apnea (OSA)", fileName: "articlesUnderwriting QuestionnairesObstructive Sleep Apnea OSA Impairment Guide.pdf", category: "Respiratory" },
      { title: "Occupations", fileName: "articlesUnderwriting QuestionnairesOccupation Questionnaire.pdf", category: "Occupational" },
      { title: "Parkinson's Disease", fileName: "articlesUnderwriting QuestionnairesParkinsons Disease Impairment Guide.pdf", category: "Neurological" },
      { title: "Peripheral Artery Disease (PAD)", fileName: "articlesUnderwriting QuestionnairesPeripheral Artery Disease PAD Impairment Guide.pdf", category: "Cardiac" },
      { title: "Post-Traumatic Stress Disorder (PTSD)", fileName: "articlesUnderwriting QuestionnairesPost-Traumatic Stress Disorder PTSD Impairment Guide.pdf", category: "Mental Health" },
      { title: "Prostate Cancer", fileName: "articlesUnderwriting QuestionnairesProstate Cancer Impairment Guide.pdf", category: "Cancer" },
      { title: "Rheumatoid Arthritis", fileName: "articlesUnderwriting QuestionnairesRheumatoid Arthritis Impairment Guide.pdf", category: "Autoimmune" },
      { title: "Schizophrenia", fileName: "articlesUnderwriting QuestionnairesSchizophrenia Impairment Guide.pdf", category: "Mental Health" },
      { title: "Sickle Cell Disease", fileName: "articlesUnderwriting QuestionnairesSickle Cell Disease Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Stroke (CVA)", fileName: "articlesUnderwriting QuestionnairesStroke CVA Impairment Guide.pdf", category: "Neurological" },
      { title: "Thyroid Disorders", fileName: "articlesUnderwriting QuestionnairesThyroid Disorders Impairment Guide.pdf", category: "Endocrine" },
      { title: "Tobacco Usage", fileName: "articlesUnderwriting QuestionnairesTobacco Usage Questionnaire.pdf", category: "Lifestyle" },
      { title: "Transient Ischemic Attack (TIA)", fileName: "articlesUnderwriting QuestionnairesTransient Ischemic Attack TIA Impairment Guide.pdf", category: "Neurological" },
      { title: "Traumatic Brain Injury (TBI)", fileName: "articlesUnderwriting QuestionnairesTraumatic Brain Injury TBI Impairment Guide.pdf", category: "Neurological" },
      { title: "Ulcerative Colitis", fileName: "articlesUnderwriting QuestionnairesUlcerative Colitis Impairment Guide.pdf", category: "Medical Conditions" },
      { title: "Valvular Heart Disease", fileName: "articlesUnderwriting QuestionnairesValvular Heart Disease Impairment Guide.pdf", category: "Cardiac" },
    ];

    setDocuments(catalogDocs);
    setLoading(false);
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(documents.map(d => d.category)));
    return uniqueCategories.sort();
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField].toLowerCase();
      const bVal = b[sortField].toLowerCase();

      if (sortDirection === "asc") {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [searchTerm, sortField, sortDirection, filterCategory, documents]);

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredDocuments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredDocuments, currentPage, rowsPerPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategory]);

  const handleSort = (field: keyof CatalogDocument) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: keyof CatalogDocument }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (sortDirection === "asc") {
      return (
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading catalog...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Underwriting Questionnaires Catalog
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive collection of impairment guides and underwriting questionnaires
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Condition or Questionnaire
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by condition name..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Category
              </label>
              <select
                id="categoryFilter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count and Rows Per Page */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginatedDocuments.length} of {filteredDocuments.length} documents
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Condition / Topic
                      <SortIcon field="title" />
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-2">
                      Category
                      <SortIcon field="category" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2">No documents found matching your criteria</p>
                    </td>
                  </tr>
                ) : (
                  paginatedDocuments.map((doc, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {doc.title}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {doc.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/catalog/${encodeURIComponent(doc.fileName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </a>
                          <a
                            href={`/catalog/${encodeURIComponent(doc.fileName)}`}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredDocuments.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
