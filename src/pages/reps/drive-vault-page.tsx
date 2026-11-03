import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleStatusCard } from '@/components/google/google-status-card';
import { CreateFolderDialog } from '@/components/google/create-folder-dialog';
import { DeleteDriveFileDialog } from '@/components/google/delete-drive-file-dialog';
import { DriveFileList } from '@/components/google/drive-file-list';
import { useFolderFilesQuery } from '@/hooks/use-google-vault';
import { useCoursesQuery } from '@/hooks/use-courses';
import type { DriveFileItem, CreateFolderResponse } from '@/types';
import { toast } from 'sonner';
import {
  FolderPlus,
  FolderSearch,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  RotateCw,
} from 'lucide-react';

export function DriveVaultPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteFileDialogFile, setDeleteFileDialogFile] = useState<DriveFileItem | null>(null);

  // Active folder exploration
  const [folderIdInput, setFolderIdInput] = useState('');
  const [activeFolderId, setActiveFolderId] = useState('');
  const [copiedFolderId, setCopiedFolderId] = useState(false);

  // Load courses to populate Quick Course Select
  const { data: coursesData } = useCoursesQuery({ limit: 100 });
  const coursesWithFolder = (coursesData?.items || []).filter((c) => Boolean(c.slidesFolderId));

  // Check URL params for OAuth callback return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      toast.success('Google Drive Connected', {
        description: 'OAuth2 authorization completed and encrypted tokens persisted.',
      });
      // Clean query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const {
    data: files = [],
    isLoading: isLoadingFiles,
    isFetching: isFetchingFiles,
    refetch: refetchFiles,
  } = useFolderFilesQuery(activeFolderId);

  const handleExplore = (id: string) => {
    const clean = id.trim();
    if (!clean) {
      toast.error('Please enter or select a valid Google Drive Folder ID');
      return;
    }
    setActiveFolderId(clean);
    setFolderIdInput(clean);
  };

  const handleFolderCreated = (folder: CreateFolderResponse) => {
    if (folder.id) {
      handleExplore(folder.id);
    }
  };

  const copyActiveFolderId = async () => {
    if (!activeFolderId) return;
    try {
      await navigator.clipboard.writeText(activeFolderId);
      setCopiedFolderId(true);
      toast.success('Folder ID copied to clipboard');
      setTimeout(() => setCopiedFolderId(false), 2000);
    } catch {
      toast.error('Failed to copy Folder ID');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Google Drive Vault"
        description="Centralized cloud storage infrastructure, OAuth token administration, and course folder provisioning."
      >
        <Button onClick={() => setCreateDialogOpen(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          Create Drive Folder
        </Button>
      </PageHeader>

      {/* OAuth Connection Status Card */}
      <GoogleStatusCard />

      {/* Cloud Folder Explorer Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderSearch className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Drive Folder Explorer & Material Inspector
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Inspect files stored inside any course slides folder or arbitrary Google Drive directory.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Quick Select & Folder Input Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Course Selector */}
            <div className="space-y-1.5">
              <label htmlFor="drive-quick-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Quick-Select Course Vault
              </label>
              <select
                id="drive-quick-select"
                onChange={(e) => {
                  if (e.target.value) {
                    handleExplore(e.target.value);
                  }
                }}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a registered course with Drive folder...</option>
                {coursesWithFolder.map((c) => (
                  <option key={c.id} value={c.slidesFolderId!}>
                    {c.id} - {c.name} ({c.slidesFolderId})
                  </option>
                ))}
              </select>
            </div>

            {/* Manual Folder ID Input */}
            <div className="space-y-1.5">
              <label htmlFor="drive-folder-id-input" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Manual Google Drive Folder ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="drive-folder-id-input"
                  placeholder="Paste Folder ID (e.g. 1A2b3C4d5E...)"
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleExplore(folderIdInput)}
                  className="shrink-0 text-xs"
                >
                  Inspect Folder
                </Button>
              </div>
            </div>
          </div>

          {/* Active Folder Header Banner */}
          {activeFolderId && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/30 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-foreground shrink-0">Active Folder:</span>
                <span className="font-mono text-foreground truncate max-w-xs">{activeFolderId}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                  onClick={copyActiveFolderId}
                  title="Copy Folder ID"
                >
                  {copiedFolderId ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {files.length} {files.length === 1 ? 'file' : 'files'} indexed
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => refetchFiles()}
                  disabled={isFetchingFiles}
                  title="Refresh folder files"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isFetchingFiles ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          )}

          {/* Files List View */}
          {activeFolderId ? (
            <DriveFileList
              files={files}
              isLoading={isLoadingFiles}
              isRep={true}
              onDelete={(file) => setDeleteFileDialogFile(file)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground border border-dashed border-border rounded-lg bg-card">
              <RefreshCw className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium text-foreground">No Folder Selected</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                Choose a course from the dropdown above or enter a Google Drive folder ID to browse and manage materials.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateFolderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleFolderCreated}
      />

      <DeleteDriveFileDialog
        file={deleteFileDialogFile}
        folderId={activeFolderId}
        open={!!deleteFileDialogFile}
        onOpenChange={(open) => {
          if (!open) setDeleteFileDialogFile(null);
        }}
      />
    </div>
  );
}

