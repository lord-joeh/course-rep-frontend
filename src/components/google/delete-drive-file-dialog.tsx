import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteDriveFileMutation } from '@/hooks/use-google-vault';
import type { DriveFileItem } from '@/types';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteDriveFileDialogProps {
  file: DriveFileItem | null;
  folderId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDriveFileDialog({
  file,
  folderId,
  open,
  onOpenChange,
}: DeleteDriveFileDialogProps) {
  const deleteMutation = useDeleteDriveFileMutation(folderId, () => {
    onOpenChange(false);
  });

  const handleDelete = () => {
    if (!file) return;
    deleteMutation.mutate(file.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Delete Cloud File?</DialogTitle>
              <DialogDescription>
                Permanently remove file from Google Drive storage.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm text-foreground">
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="text-foreground">{file?.name || 'this file'}</strong>?
          </p>

          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Permanent File Removal
            </p>
            <p>
              This file will be completely erased from Google Drive. Any slide attachments or student
              downloads referencing this file ID will no longer be available.
            </p>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

