'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function SmartOfficeImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/smartoffice/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setFile(null);
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            SmartOffice Data Import
          </h1>
          <p className="text-gray-600">
            Upload SmartOffice Excel reports to sync your policies and agents data
          </p>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-400 mb-4" />

            {!file ? (
              <>
                <p className="text-gray-700 mb-2 font-medium">
                  Drop your SmartOffice Excel file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Supports: All Policies Report, Valor Agents Report (.xlsx, .xls)
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Select File
                  </span>
                </label>
              </>
            ) : (
              <>
                <div className="bg-blue-50 rounded-lg p-4 mb-4 inline-block">
                  <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Import Data
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                    disabled={uploading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`rounded-lg shadow-md p-6 ${
              result.success ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              )}

              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </h3>

                {result.success && result.data && (
                  <>
                    <p className="text-gray-700 mb-4">{result.message}</p>

                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Report Type:</span>
                          <span className="ml-2 font-medium capitalize">{result.data.type}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-medium">{result.data.duration}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records Created:</span>
                          <span className="ml-2 font-medium text-green-600">{result.data.recordsCreated}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records Updated:</span>
                          <span className="ml-2 font-medium text-blue-600">{result.data.recordsUpdated}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Records Failed:</span>
                          <span className="ml-2 font-medium text-red-600">{result.data.recordsFailed}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Processed:</span>
                          <span className="ml-2 font-medium">{result.data.recordsProcessed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <a
                        href="/smartoffice"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View Dashboard →
                      </a>
                    </div>
                  </>
                )}

                {!result.success && (
                  <div>
                    <p className="text-red-900 font-medium mb-2">{result.error}</p>
                    {result.errors && result.errors.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mt-3">
                        <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {result.errors.slice(0, 10).map((error: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              {error}
                            </li>
                          ))}
                          {result.errors.length > 10 && (
                            <li className="text-gray-500 italic">
                              ... and {result.errors.length - 10} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {result.warnings && result.warnings.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 mt-3 border border-yellow-200">
                    <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Warnings:
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {result.warnings.slice(0, 5).map((warning: string, idx: number) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 How to Import</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Export your report from SmartOffice (All Policies Report or Valor Agents Report)</li>
            <li>Click "Select File" and choose the Excel file</li>
            <li>Click "Import Data" to upload and process</li>
            <li>The system will automatically detect the report type and import the data</li>
            <li>Duplicate records will be updated automatically</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
