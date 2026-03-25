'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SmartOfficeUploadPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setResults(null);

    try {
      const formData = new FormData();

      // Add all selected files
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/admin/smartoffice-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setResults({
        success: true,
        message: 'Import completed successfully!',
        details: data,
      });

      // Refresh the page after 3 seconds
      setTimeout(() => {
        router.refresh();
      }, 3000);

    } catch (error: any) {
      setResults({
        success: false,
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
          </div>
          <p className="text-gray-600">
            Upload SmartOffice spreadsheets to update the live site data
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            Upload Spreadsheets
          </h2>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
              <li>Select one or more spreadsheet files (.xlsx, .xls, or .csv)</li>
              <li>System automatically detects if they're policies or agents</li>
              <li>All old data is deleted and replaced with new data</li>
              <li>Dashboard updates immediately</li>
            </ol>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <label className="cursor-pointer">
              <span className="text-lg font-medium text-gray-700 hover:text-blue-600">
                Click to select files
              </span>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <p className="text-sm text-gray-500 mt-2">
              Accepts .xlsx, .xls, and .csv files (can select multiple)
            </p>
          </div>

          {/* Loading State */}
          {uploading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <div>
                  <p className="font-semibold text-blue-900">Processing...</p>
                  <p className="text-sm text-blue-700">
                    Uploading and importing spreadsheets. This may take a minute.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div
              className={`mt-6 rounded-lg p-6 ${
                results.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {results.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      results.success ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {results.message}
                  </p>

                  {results.success && results.details && (
                    <div className="mt-4 space-y-2">
                      {results.details.policiesImported > 0 && (
                        <p className="text-sm text-green-800">
                          ✓ Policies imported: {results.details.policiesImported}
                        </p>
                      )}
                      {results.details.agentsImported > 0 && (
                        <p className="text-sm text-green-800">
                          ✓ Agents imported: {results.details.agentsImported}
                        </p>
                      )}
                      {results.details.filesProcessed && (
                        <p className="text-sm text-green-800">
                          ✓ Files processed: {results.details.filesProcessed.join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-green-700 mt-3">
                        Dashboard will refresh automatically...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Warning:</strong> Uploading spreadsheets will DELETE all existing policies
            and agents data and replace it with the data from your files. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
