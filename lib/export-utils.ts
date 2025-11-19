import * as XLSX from 'xlsx';

/**
 * Export Utility Functions for Reports
 * Supports CSV, Excel (XLSX), and PDF export formats
 */

// CSV Export
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Handle values with commas by wrapping in quotes
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Excel Export
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate Excel file and download
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Multi-sheet Excel Export
export function exportToExcelMultiSheet(
  sheets: { data: any[]; name: string }[],
  filename: string
) {
  if (!sheets || sheets.length === 0) {
    console.warn('No sheets to export');
    return;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach((sheet) => {
    if (sheet.data && sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    }
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Format currency for exports
export function formatCurrencyForExport(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// Format percentage for exports
export function formatPercentageForExport(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Format date for exports
export function formatDateForExport(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Prepare commission data for export
export function prepareCommissionDataForExport(data: any) {
  if (!data || !data.recentCommissions) return [];

  return data.recentCommissions.map((commission: any) => ({
    Date: formatDateForExport(commission.createdAt),
    Agent: `${commission.agent?.firstName || ''} ${commission.agent?.lastName || ''}`.trim(),
    Carrier: commission.case?.carrier || 'N/A',
    'Product Type': commission.case?.productType || 'N/A',
    Premium: formatCurrencyForExport(commission.case?.premium || 0),
    'Commission Amount': formatCurrencyForExport(commission.amount || 0),
    Status: commission.status || 'PENDING',
    'Payment Date': commission.paidDate ? formatDateForExport(commission.paidDate) : 'N/A',
  }));
}

// Prepare production data for export
export function prepareProductionDataForExport(data: any) {
  if (!data || !data.agentRankings) return [];

  return data.agentRankings.map((agent: any, index: number) => ({
    Rank: index + 1,
    Agent: `${agent.agent?.firstName || ''} ${agent.agent?.lastName || ''}`.trim(),
    'Total Cases': agent.cases || 0,
    'Total Premium': formatCurrencyForExport(agent.premium || 0),
    'Total Commission': formatCurrencyForExport(agent.commission || 0),
    'Average Premium': formatCurrencyForExport((agent.premium || 0) / (agent.cases || 1)),
    'Submitted Cases': agent.submitted || 0,
    'Issued Cases': agent.issued || 0,
    'Close Rate': agent.cases > 0
      ? formatPercentageForExport((agent.submitted / agent.cases) * 100)
      : '0.00%',
  }));
}

// Prepare executive summary for export
export function prepareExecutiveSummaryForExport(data: any) {
  if (!data) return [];

  const summary = [
    {
      Metric: 'Total Cases (YTD)',
      Value: data.ytd?.totalCases || 0,
      'vs Last Year': formatPercentageForExport(data.growth?.vsLastYear?.cases || 0),
    },
    {
      Metric: 'Total Premium (YTD)',
      Value: formatCurrencyForExport(data.ytd?.totalPremium || 0),
      'vs Last Year': formatPercentageForExport(data.growth?.vsLastYear?.premium || 0),
    },
    {
      Metric: 'Total Commission (YTD)',
      Value: formatCurrencyForExport(data.ytd?.totalCommission || 0),
      'vs Last Year': formatPercentageForExport(data.growth?.vsLastYear?.commission || 0),
    },
    {
      Metric: 'Average Premium',
      Value: formatCurrencyForExport(data.ytd?.averagePremium || 0),
      'vs Last Year': 'N/A',
    },
    {
      Metric: 'Conversion Rate',
      Value: formatPercentageForExport(data.ytd?.conversionRate || 0),
      'vs Last Year': 'N/A',
    },
    {
      Metric: 'Issue Rate',
      Value: formatPercentageForExport(data.ytd?.issueRate || 0),
      'vs Last Year': 'N/A',
    },
  ];

  return summary;
}

// Prepare monthly trend for export
export function prepareMonthlyTrendForExport(monthlyTrend: any[]) {
  if (!monthlyTrend || monthlyTrend.length === 0) return [];

  return monthlyTrend.map((month) => ({
    Month: month.month,
    Cases: month.cases || 0,
    Premium: formatCurrencyForExport(month.premium || 0),
    Commission: formatCurrencyForExport(month.commission || 0),
    Submitted: month.submitted || 0,
    Issued: month.issued || 0,
  }));
}

// Prepare product mix for export
export function prepareProductMixForExport(productMix: any) {
  if (!productMix) return [];

  return Object.entries(productMix).map(([product, data]: [string, any]) => ({
    Product: product,
    Count: data.count || 0,
    Premium: formatCurrencyForExport(data.premium || 0),
    'Percentage of Total': formatPercentageForExport(data.percentage || 0),
  }));
}

// Prepare top agents for export
export function prepareTopAgentsForExport(topAgents: any[]) {
  if (!topAgents || topAgents.length === 0) return [];

  return topAgents.map((agent, index) => ({
    Rank: index + 1,
    Agent: `${agent.agent?.firstName || ''} ${agent.agent?.lastName || ''}`.trim(),
    Cases: agent.cases || 0,
    Premium: formatCurrencyForExport(agent.premium || 0),
    Commission: formatCurrencyForExport(agent.commission || 0),
  }));
}

// Create comprehensive Excel report with multiple sheets
export function exportExecutiveReportToExcel(data: any, filename: string) {
  const sheets = [
    {
      name: 'Executive Summary',
      data: prepareExecutiveSummaryForExport(data),
    },
    {
      name: 'Monthly Trend',
      data: prepareMonthlyTrendForExport(data.monthlyTrend),
    },
    {
      name: 'Product Mix',
      data: prepareProductMixForExport(data.productMix),
    },
    {
      name: 'Top Agents',
      data: prepareTopAgentsForExport(data.topAgents),
    },
  ];

  exportToExcelMultiSheet(sheets, filename);
}

export function exportProductionReportToExcel(data: any, filename: string) {
  const sheets = [
    {
      name: 'Agent Rankings',
      data: prepareProductionDataForExport(data),
    },
    {
      name: 'Monthly Trend',
      data: prepareMonthlyTrendForExport(data.monthlyTrend),
    },
  ];

  exportToExcelMultiSheet(sheets, filename);
}

export function exportCommissionReportToExcel(data: any, filename: string) {
  const sheets = [
    {
      name: 'Recent Commissions',
      data: prepareCommissionDataForExport(data),
    },
    {
      name: 'Monthly Trend',
      data: prepareMonthlyTrendForExport(data.monthlyTrend),
    },
  ];

  exportToExcelMultiSheet(sheets, filename);
}
