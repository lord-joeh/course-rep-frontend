import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateFolderMutation } from '@/hooks/use-google-vault';
import { createFolderSchema } from '@/lib/google-validation';
import type { CreateFolderResponse } from '@/types';
import { toast } from 'sonner';
import { FolderPlus, Loader2, Copy, Check, Folder } from 'lucide-react';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (folder: CreateFolderResponse) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState('');
  const [createdFolder, setCreatedFolder] = useState<CreateFolderResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateFolderMutation((data) => {
    if (data) {
      setCreatedFolder(data);
      onCreated?.(data);
    }
  });

  const resetForm = () => {
    setFolderName('');
    setParentFolderId('');
    setCreatedFolder(null);
    setCopied(false);
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleCopyFolderId = async () => {
    if (!createdFolder?.id) return;
    try {
      await navigator.clipboard.writeText(createdFolder.id);
      setCopied(true);
      toast.success('Folder ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy Folder ID');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationResult = createFolderSchema.safeParse({
      folderName: folderName.trim(),
      parentFolderId: parentFolderId.trim() || undefined,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validationResult.error.issues) {
        const path = String(issue.path[0]);
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    createMutation.mutate(validationResult.data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Create Drive Vault Folder</DialogTitle>
              <DialogDescription>
                Create a dedicated course folder on institutional Google Drive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {createdFolder ? (
          // Post-creation Confirmation State
          <div className="space-y-4 py-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Folder className="h-4 w-4 text-primary" />
                <span>{createdFolder.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Google Drive Folder ID generated successfully:
              </p>
              <div className="flex items-center justify-between gap-2 p-2 rounded bg-background border border-border font-mono text-xs text-foreground">
                <span className="truncate">{createdFolder.id}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 shrink-0"
                  onClick={handleCopyFolderId}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copy ID
                    </>
                  )}
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Creation Form
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="create-folder-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5" />
                Folder Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="create-folder-name"
                placeholder="e.g. CPEN401 Course Materials"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  if (errors.folderName) setErrors((prev) => ({ ...prev, folderName: '' }));
                }}
                className={errors.folderName ? 'border-destructive focus-visible:ring-destructive' : ''}
                disabled={createMutation.isPending}
                autoFocus
              />
              {errors.folderName && (
                <p className="text-xs text-destructive font-medium">{errors.folderName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="create-parent-folder" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parent Folder ID <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <Input
                id="create-parent-folder"
                placeholder="Leave blank for institutional root"
                value={parentFolderId}
                onChange={(e) => setParentFolderId(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Folder...
                  </>
                ) : (
                  'Create Folder'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
