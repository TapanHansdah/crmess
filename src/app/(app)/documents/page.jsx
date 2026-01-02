'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import DocumentList from '@/components/documents/document-list';
import { fetchDocuments, deleteDocument, addDocument } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, X, File } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Blocked file types (audio and video)
const BLOCKED_EXTENSIONS = [
  'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'aiff',
  'mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', '3gp', 'ogv'
];

export default function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_id: null,
    lead_id: null,
    organization_id: null,
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  const getFileType = (filename) => {
    const ext = getFileExtension(filename);
    const typeMap = {
      'pdf': 'pdf',
      'doc': 'doc',
      'docx': 'doc',
      'xls': 'xls',
      'xlsx': 'xls',
      'ppt': 'ppt',
      'pptx': 'ppt',
      'txt': 'txt',
      'csv': 'csv',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'zip': 'zip',
      'rar': 'zip',
      '7z': 'zip',
    };
    return typeMap[ext] || 'other';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const ext = getFileExtension(file.name);
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      toast({
        title: 'File Not Allowed',
        description: 'Audio and video files cannot be uploaded. Please select a different file type.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    // Auto-fill name from filename if not already filled
    if (!formData.name) {
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.'));
      setFormData(prev => ({
        ...prev,
        name: nameWithoutExt
      }));
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setFormData({
      name: '',
      description: '',
      contact_id: null,
      lead_id: null,
      organization_id: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleOpenDialog = useCallback(() => {
    setSelectedFile(null);
    setFormData({
      name: '',
      description: '',
      contact_id: null,
      lead_id: null,
      organization_id: null,
    });
    setShowDialog(true);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a document name',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      // Upload file to server
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('name', formData.name);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('contact_id', formData.contact_id || null);
      uploadFormData.append('lead_id', formData.lead_id || null);
      uploadFormData.append('organization_id', formData.organization_id || null);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Document "${formData.name}" uploaded successfully!`,
      });

      closeDialog();
      setTimeout(() => loadDocuments(), 500);
    } catch (err) {
      console.error('Upload failed:', err);
      toast({
        title: 'Upload Failed',
        description: err.message || 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [selectedFile, formData, toast, closeDialog]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const success = await deleteDocument(id);
      if (success) {
        toast({
          title: 'Success',
          description: 'Document deleted successfully',
        });
        setTimeout(() => loadDocuments(), 100);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete document',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
            <p className="text-muted-foreground mt-2">Manage all project documents and files</p>
          </div>
          <Button onClick={handleOpenDialog} disabled>
            <Plus className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">Manage all project documents and files</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <DocumentList documents={documents} onDelete={handleDelete} onEdit={() => {}} />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <Label htmlFor="file-input">Select File *</Label>
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                  disabled={uploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors disabled:opacity-50"
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <File className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <p className="text-sm font-medium">Click to browse or drag file</p>
                      <p className="text-xs text-gray-500">All files except audio & video</p>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Document Name */}
            <div>
              <Label htmlFor="name">Document Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Contract 2025"
                disabled={uploading}
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                disabled={uploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows="3"
              />
            </div>

            {/* Contact ID */}
            <div>
              <Label htmlFor="contact_id">Contact ID</Label>
              <Input
                id="contact_id"
                type="number"
                value={formData.contact_id || ''}
                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Optional"
                disabled={uploading}
              />
            </div>

            {/* Lead ID */}
            <div>
              <Label htmlFor="lead_id">Lead ID</Label>
              <Input
                id="lead_id"
                type="number"
                value={formData.lead_id || ''}
                onChange={(e) => setFormData({ ...formData, lead_id: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Optional"
                disabled={uploading}
              />
            </div>

            {/* Organization ID */}
            <div>
              <Label htmlFor="organization_id">Organization ID</Label>
              <Input
                id="organization_id"
                type="number"
                value={formData.organization_id || ''}
                onChange={(e) => setFormData({ ...formData, organization_id: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Optional"
                disabled={uploading}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
              {uploading ? `Uploading (${uploadProgress}%)` : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
