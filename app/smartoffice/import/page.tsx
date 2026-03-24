'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, Info, ArrowRight } from 'lucide-react';

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

                    {/* Column Mapping Info */}
                    {result.columnMapping && result.columnMapping.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 mt-4 border border-blue-200">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Column Mapping ({result.columnMapping.length} fields matched)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {result.columnMapping.slice(0, 6).map((mapping: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-blue-800">
                              <span className="font-medium">{mapping.excelColumn}</span>
                              <ArrowRight className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-600">{mapping.systemField}</span>
                              {mapping.matchType !== 'exact' && (
                                <span className="text-xs bg-blue-200 px-2 py-0.5 rounded">
                                  {mapping.matchType}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {result.columnMapping.length > 6 && (
                          <p className="text-xs text-blue-600 mt-2">
                            + {result.columnMapping.length - 6} more columns mapped
                          </p>
                        )}
                        {result.unmappedColumns && result.unmappedColumns.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-xs text-blue-700">
                              <strong>Unmapped columns:</strong> {result.unmappedColumns.join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

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

                    {/* Validation Errors */}
                    {result.validation?.errors && result.validation.errors.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mt-3 border-2 border-red-300">
                        <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                          <XCircle className="w-5 h-5" />
                          Validation Errors ({result.validation.errors.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {result.validation.errors.slice(0, 15).map((error: any, idx: number) => (
                            <div key={idx} className="bg-red-50 rounded p-3 text-sm">
                              <div className="flex items-start justify-between mb-1">
                                <span className="font-medium text-red-900">Row {error.row}</span>
                                <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded">
                                  {error.field}
                                </span>
                              </div>
                              <p className="text-red-800">{error.message}</p>
                              {error.value !== null && error.value !== undefined && (
                                <p className="text-xs text-red-600 mt-1">
                                  Value: {String(error.value)}
                                </p>
                              )}
                            </div>
                          ))}
                          {result.validation.errors.length > 15 && (
                            <p className="text-sm text-gray-500 italic text-center py-2">
                              ... and {result.validation.errors.length - 15} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Processing Errors (legacy format) */}
                    {result.errors && result.errors.length > 0 && !result.validation?.errors && (
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

                {/* Validation Warnings */}
                {result.validation?.warnings && result.validation.warnings.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4 mt-3 border border-yellow-300">
                    <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Validation Warnings ({result.validation.warnings.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.validation.warnings.slice(0, 10).map((warning: any, idx: number) => (
                        <div key={idx} className="bg-yellow-100 rounded p-2 text-sm">
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-yellow-900">Row {warning.row}</span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                              {warning.field}
                            </span>
                          </div>
                          <p className="text-yellow-800">{warning.message}</p>
                        </div>
                      ))}
                      {result.validation.warnings.length > 10 && (
                        <p className="text-sm text-yellow-700 italic text-center py-2">
                          + {result.validation.warnings.length - 10} more warnings
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Processing Warnings (legacy format) */}
                {result.warnings && result.warnings.length > 0 && !result.validation?.warnings && (
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
            <li>The system will automatically detect the report type and validate the data</li>
            <li>Column headers are matched intelligently - columns can be in any order</li>
            <li>Imports are validated before processing - errors will block the import</li>
            <li>All data is replaced on each import (REPLACE mode)</li>
          </ol>
        </div>

        {/* Features Info */}
        <div className="bg-gray-50 rounded-lg p-6 mt-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">✨ Import Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">Smart Column Matching</strong>
              <p className="text-gray-600 mt-1">Columns are matched by header name, not position. Works with reordered or renamed columns.</p>
            </div>
            <div>
              <strong className="text-gray-900">Pre-Import Validation</strong>
              <p className="text-gray-600 mt-1">Data is validated before import. Errors block import, warnings are shown but allow import.</p>
            </div>
            <div>
              <strong className="text-gray-900">Permission Controls</strong>
              <p className="text-gray-600 mt-1">Only administrators and managers can import data for security.</p>
            </div>
            <div>
              <strong className="text-gray-900">Complete Audit Trail</strong>
              <p className="text-gray-600 mt-1">Every import is tracked with who, what, when for compliance.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
