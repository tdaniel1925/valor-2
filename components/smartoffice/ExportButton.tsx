'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  exportType: 'policies' | 'agents';
  currentFilters?: URLSearchParams;
  disabled?: boolean;
}

export default function ExportButton({
  exportType,
  currentFilters,
  disabled = false,
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      // Build export URL with current filters
      const params = new URLSearchParams(currentFilters || {});
      params.set('type', exportType);

      const url = `/api/smartoffice/export?${params.toString()}`;

      // Trigger download
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `smartoffice-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || exporting}
      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title={`Export ${exportType} to CSV`}
    >
      {exporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          Export CSV
        </>
      )}
    </button>
  );
}
