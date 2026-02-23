'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@zapticket/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@zapticket/ui/components/ui/card';
import {
  Upload,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  X,
  Download,
} from 'lucide-react';

interface DataImport {
  id: string;
  source: string;
  status: string;
  fileName: string;
  fileSize: number;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorLog: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: { id: string; name: string | null; email: string };
}

const IMPORT_SOURCES = [
  { value: 'ZENDESK', label: 'Zendesk', icon: '🎫', description: 'Import from Zendesk JSON export' },
  { value: 'ZAMMAD', label: 'Zammad', icon: '💬', description: 'Import from Zammad JSON export' },
  { value: 'FRESHDESK', label: 'Freshdesk', icon: '🍎', description: 'Import from Freshdesk export' },
  { value: 'HELPSCOUT', label: 'Help Scout', icon: '📮', description: 'Import from Help Scout export' },
  { value: 'CSV', label: 'CSV File', icon: '📄', description: 'Import from CSV file' },
  { value: 'JSON', label: 'JSON File', icon: '📋', description: 'Import from generic JSON' },
];

export default function DataImportPage() {
  const router = useRouter();
  const [imports, setImports] = useState<DataImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('ZENDESK');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState({
    createUsers: true,
    createCustomers: true,
    skipDuplicates: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImports();
    const interval = setInterval(fetchImports, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchImports = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/data-imports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setImports(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch imports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.json') || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('source', selectedSource);
      formData.append('options', JSON.stringify(options));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/data-imports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setSelectedFile(null);
        fetchImports();
      } else {
        const error = await res.json();
        alert(error.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = async (importId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/data-imports/${importId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchImports();
    } catch (error) {
      console.error('Failed to cancel import:', error);
    }
  };

  const handleDelete = async (importId: string) => {
    if (!confirm('Are you sure you want to delete this import record?')) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/data-imports/${importId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchImports();
    } catch (error) {
      console.error('Failed to delete import:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'FAILED':
        return 'text-red-600 bg-red-50';
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-50';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'CANCELLED':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold cursor-pointer" onClick={() => router.push('/dashboard')}>
            ZapTicket
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Data Import</h2>
          <p className="text-muted-foreground">Import tickets from other help desk systems</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload Export File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Import Source</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {IMPORT_SOURCES.map((source) => (
                    <button
                      key={source.value}
                      onClick={() => setSelectedSource(source.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedSource === source.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-lg">{source.icon}</span>
                      <p className="font-medium text-sm mt-1">{source.label}</p>
                      <p className="text-xs text-muted-foreground">{source.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {selectedFile.name.endsWith('.csv') ? (
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    ) : (
                      <FileJson className="h-8 w-8 text-blue-600" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Drop your export file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-2">Supports JSON and CSV files up to 50MB</p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Options</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.createUsers}
                      onChange={(e) => setOptions({ ...options, createUsers: e.target.checked })}
                      className="rounded"
                    />
                    Create users if they don't exist
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.createCustomers}
                      onChange={(e) => setOptions({ ...options, createCustomers: e.target.checked })}
                      className="rounded"
                    />
                    Create customer profiles
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={options.skipDuplicates}
                      onChange={(e) => setOptions({ ...options, skipDuplicates: e.target.checked })}
                      className="rounded"
                    />
                    Skip duplicate tickets
                  </label>
                </div>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-1">Zendesk Export</h4>
                <p className="text-muted-foreground">
                  Go to Admin → Manage → Reports → Export. Select "Full JSON export".
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Zammad Export</h4>
                <p className="text-muted-foreground">
                  Use the API or admin panel to export tickets as JSON.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">CSV Format</h4>
                <p className="text-muted-foreground">
                  Required columns: subject, description, status, priority, requester_email
                </p>
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-1">Field Mapping</h4>
                <p className="text-muted-foreground">
                  Status values are automatically mapped (new → OPEN, solved → RESOLVED, etc.)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : imports.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No imports yet. Upload a file to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {imports.map((imp) => (
                  <div key={imp.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {imp.fileName.endsWith('.csv') ? (
                        <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      ) : (
                        <FileJson className="h-8 w-8 text-blue-600" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{imp.fileName}</p>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusColor(imp.status)}`}>
                            {getStatusIcon(imp.status)}
                            {imp.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatBytes(imp.fileSize)} • {imp.source} • {formatDate(imp.createdAt)}
                        </p>
                        {imp.status === 'PROCESSING' && (
                          <div className="mt-2">
                            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${(imp.processedRecords / (imp.totalRecords || 1)) * 100}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {imp.processedRecords} / {imp.totalRecords} records
                            </p>
                          </div>
                        )}
                        {imp.status === 'COMPLETED' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {imp.processedRecords} imported, {imp.failedRecords} failed
                          </p>
                        )}
                        {imp.errorLog && (
                          <details className="mt-2">
                            <summary className="text-xs text-red-600 cursor-pointer">View errors</summary>
                            <pre className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1 overflow-auto max-h-32">
                              {imp.errorLog}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {imp.status === 'PROCESSING' && (
                        <Button variant="outline" size="sm" onClick={() => handleCancel(imp.id)}>
                          Cancel
                        </Button>
                      )}
                      {imp.status !== 'PROCESSING' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(imp.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
