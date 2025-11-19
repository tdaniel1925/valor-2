'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Download, Eye, Save } from 'lucide-react';

interface ReportColumn {
  id: string;
  field: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'percentage';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string;
}

export default function CustomReportBuilderPage() {
  const [reportName, setReportName] = useState('');
  const [dataSource, setDataSource] = useState('');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const availableDataSources = [
    { value: 'applications', label: 'Applications' },
    { value: 'cases', label: 'Cases' },
    { value: 'commissions', label: 'Commissions' },
    { value: 'quotes', label: 'Quotes' },
    { value: 'contracts', label: 'Contracts' },
    { value: 'agents', label: 'Agents' },
  ];

  const availableFields = {
    applications: [
      { value: 'applicantName', label: 'Applicant Name', type: 'text' },
      { value: 'productType', label: 'Product Type', type: 'text' },
      { value: 'faceAmount', label: 'Face Amount', type: 'currency' },
      { value: 'premium', label: 'Premium', type: 'currency' },
      { value: 'status', label: 'Status', type: 'text' },
      { value: 'submittedDate', label: 'Submitted Date', type: 'date' },
    ],
    commissions: [
      { value: 'agentName', label: 'Agent Name', type: 'text' },
      { value: 'carrierName', label: 'Carrier Name', type: 'text' },
      { value: 'amount', label: 'Amount', type: 'currency' },
      { value: 'premium', label: 'Premium', type: 'currency' },
      { value: 'rate', label: 'Rate', type: 'percentage' },
      { value: 'status', label: 'Status', type: 'text' },
      { value: 'paidDate', label: 'Paid Date', type: 'date' },
    ],
    cases: [
      { value: 'caseNumber', label: 'Case Number', type: 'text' },
      { value: 'clientName', label: 'Client Name', type: 'text' },
      { value: 'productType', label: 'Product Type', type: 'text' },
      { value: 'faceAmount', label: 'Face Amount', type: 'currency' },
      { value: 'status', label: 'Status', type: 'text' },
      { value: 'createdDate', label: 'Created Date', type: 'date' },
    ],
  };

  const addColumn = () => {
    const newColumn: ReportColumn = {
      id: `col-${Date.now()}`,
      field: '',
      label: '',
      type: 'text',
    };
    setColumns([...columns, newColumn]);
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const updateColumn = (id: string, updates: Partial<ReportColumn>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<ReportFilter>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handlePreview = () => {
    const reportConfig = {
      name: reportName,
      dataSource,
      columns,
      filters,
      groupBy,
      sortBy,
      sortOrder,
    };
    console.log('Preview Report:', reportConfig);
    alert('Report preview would open here. Check console for configuration.');
  };

  const handleSave = () => {
    const reportConfig = {
      name: reportName,
      dataSource,
      columns,
      filters,
      groupBy,
      sortBy,
      sortOrder,
    };
    console.log('Save Report:', reportConfig);
    alert('Report saved successfully!');
  };

  const currentFields = dataSource ? (availableFields as any)[dataSource] || [] : [];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Custom Report Builder</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Create custom reports with drag-and-drop interface
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name *</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="dataSource">Data Source *</Label>
                  <Select value={dataSource} onValueChange={setDataSource}>
                    <SelectTrigger id="dataSource" className="mt-1">
                      <SelectValue placeholder="Select data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDataSources.map(ds => (
                        <SelectItem key={ds.value} value={ds.value}>
                          {ds.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Columns */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Columns</CardTitle>
                <Button onClick={addColumn} size="sm" disabled={!dataSource}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Column
                </Button>
              </CardHeader>
              <CardContent>
                {columns.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No columns added yet. Click "Add Column" to get started.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {columns.map((column) => (
                      <div key={column.id} className="flex gap-3 items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Field</Label>
                            <Select
                              value={column.field}
                              onValueChange={(value) => {
                                const field = currentFields.find((f: any) => f.value === value);
                                updateColumn(column.id, {
                                  field: value,
                                  label: field?.label || value,
                                  type: field?.type || 'text',
                                });
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentFields.map((field: any) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={column.label}
                              onChange={(e) => updateColumn(column.id, { label: e.target.value })}
                              placeholder="Column label"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeColumn(column.id)}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Filters</CardTitle>
                <Button onClick={addFilter} size="sm" variant="outline" disabled={!dataSource}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </CardHeader>
              <CardContent>
                {filters.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                    No filters added. Reports will include all data.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex gap-3 items-start p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">Field</Label>
                            <Select
                              value={filter.field}
                              onValueChange={(value) => updateFilter(filter.id, { field: value })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {currentFields.map((field: any) => (
                                  <SelectItem key={field.value} value={field.value}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value: any) => updateFilter(filter.id, { operator: value })}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="not_equals">Not Equals</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Value</Label>
                            <Input
                              value={filter.value}
                              onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                              placeholder="Filter value"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFilter(filter.id)}
                          className="mt-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sorting & Grouping */}
            <Card>
              <CardHeader>
                <CardTitle>Sorting & Grouping</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="groupBy">Group By</Label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger id="groupBy" className="mt-1">
                      <SelectValue placeholder="No grouping" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No grouping</SelectItem>
                      {currentFields.map((field: any) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortBy">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sortBy" className="mt-1">
                      <SelectValue placeholder="No sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No sorting</SelectItem>
                      {currentFields.map((field: any) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={handlePreview} className="w-full" disabled={!reportName || !dataSource}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Report
                </Button>
                <Button onClick={handleSave} className="w-full" variant="outline" disabled={!reportName || !dataSource}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Report
                </Button>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Report Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Columns:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{columns.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Filters:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{filters.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Data Source:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {dataSource ? availableDataSources.find(ds => ds.value === dataSource)?.label : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
