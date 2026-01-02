'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Download, Trash2, FileIcon } from 'lucide-react';

export default function DocumentList({ documents = [], onDelete = () => {}, onEdit = () => {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc =>
      (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.file_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const getFileTypeIcon = (type) => {
    const typeMap = {
      'pdf': 'PDF',
      'doc': 'DOC',
      'docx': 'DOCX',
      'xls': 'XLS',
      'xlsx': 'XLSX',
      'image': 'IMG',
      'other': 'FILE'
    };
    return typeMap[type] || 'FILE';
  };

  const handleDownload = (doc) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Contact ID</TableHead>
              <TableHead>Lead ID</TableHead>
              <TableHead>Org ID</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{doc.name || 'Unnamed'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                  {doc.description || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getFileTypeIcon(doc.file_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.contact_id || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.lead_id || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.organization_id || '-'}
                </TableCell>
                <TableCell className="text-sm">
                  {doc.created_at
                    ? new Date(doc.created_at).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu 
                    open={openDropdownId === doc.id} 
                    onOpenChange={(open) => {
                      setOpenDropdownId(open ? doc.id : null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                      <DropdownMenuItem onClick={(e) => { 
                        e.stopPropagation(); 
                        setOpenDropdownId(null);
                        window.open(doc.file_url, '_blank'); 
                      }}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(null);
                          onDelete(doc.id); 
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>
    </div>
  );
}
