import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDownloadDriveFile } from '@/hooks/use-google-vault';
import type { DriveFileItem } from '@/types';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Image,
  Folder,
  Download,
  Trash2,
  Loader2,
  File,
} from 'lucide-react';

interface DriveFileListProps {
  files: DriveFileItem[];
  isLoading?: boolean;
  isRep?: boolean;
  onDelete?: (file: DriveFileItem) => void;
}

export function formatBytes(bytes?: string | number): string {
  if (bytes === undefined || bytes === null || bytes === '') return 'N/A';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return `${(num / Math.pow(1024, i)).toFixed(1)} ${units[i] || 'B'}`;
}

export function getFileIcon(mimeType: string) {
  if (mimeType.includes('pdf')) {
    return <FileText className="h-5 w-5 text-red-500 shrink-0" />;
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return <FileText className="h-5 w-5 text-amber-500 shrink-0" />;
  }
  if (mimeType.includes('document') || mimeType.includes('word')) {
    return <FileText className="h-5 w-5 text-blue-500 shrink-0" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500 shrink-0" />;
  }
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
    return <FileArchive className="h-5 w-5 text-purple-500 shrink-0" />;
  }
  if (mimeType.startsWith('image/')) {
    return <Image className="h-5 w-5 text-indigo-500 shrink-0" />;
  }
  if (mimeType === 'application/vnd.google-apps.folder') {
    return <Folder className="h-5 w-5 text-yellow-500 shrink-0" />;
  }
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
    return <FileCode className="h-5 w-5 text-sky-500 shrink-0" />;
  }
  return <File className="h-5 w-5 text-muted-foreground shrink-0" />;
}

export function DriveFileList({
  files,
  isLoading = false,
  isRep = false,
  onDelete,
}: DriveFileListProps) {
  const { downloadFile, isDownloading, downloadingFileId } = useDownloadDriveFile();
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = files.filter((f) =>
    filterQuery ? f.name.toLowerCase().includes(filterQuery.toLowerCase()) : true,
  );

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card">
        <Folder className="h-10 w-10 text-muted-foreground/40 mb-2" />
        <h4 className="text-sm font-semibold text-foreground">No files in folder</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          This Google Drive folder does not currently contain any uploaded files.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* File filter bar if > 5 files */}
      {files.length > 5 && (
        <div className="px-1">
          <input
            type="text"
            placeholder="Filter files in this folder..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8 px-3 text-xs rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* Files List */}
      <div className="divide-y divide-border rounded-lg border border-border bg-card overflow-hidden">
        {filtered.map((file) => {
          const isCurrentDownloading = downloadingFileId === file.id;

          return (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 gap-3 hover:bg-muted/40 transition-colors text-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(file.mimeType)}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatBytes(file.size)}</span>
                    {file.createdTime && (
                      <>
                        <span>•</span>
                        <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => downloadFile(file.id, file.name)}
                  disabled={isDownloading}
                  title="Download file"
                >
                  {isCurrentDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Download
                    </>
                  )}
                </Button>

                {isRep && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete?.(file)}
                    title="Delete from Drive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
