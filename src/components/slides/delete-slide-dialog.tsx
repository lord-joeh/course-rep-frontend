import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDeleteSlideMutation } from '@/hooks/use-slides';
import { isVideoFile } from '@/lib/slide-validation';
import type { Slide } from '@/types';
import { Trash2, AlertTriangle, Loader2, Video, FileText } from 'lucide-react';

interface DeleteSlideDialogProps {
  slide: Slide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSlideDialog({
  slide,
  open,
  onOpenChange,
}: DeleteSlideDialogProps) {
  const deleteMutation = useDeleteSlideMutation(slide?.courseId, () => {
    onOpenChange(false);
  });

  if (!slide) return null;

  const isVideo = isVideoFile(slide.fileName);

  const handleDelete = () => {
    deleteMutation.mutate(slide.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Delete Course Material
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                This action will delete the database record and queue file removal from Google Drive.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="font-mono text-[10px] bg-primary text-primary-foreground font-bold">
                {slide.courseId}
              </Badge>
              {isVideo ? (
                <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">
                  <Video className="h-3 w-3 mr-1 inline" /> Video Recording
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  <FileText className="h-3 w-3 mr-1 inline" /> Lecture Slide / Document
                </Badge>
              )}
            </div>
            <p className="font-semibold text-sm text-foreground break-all">
              {slide.fileName}
            </p>
          </div>

          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
            <Trash2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to delete this material? Students enrolled in <strong>{slide.courseId}</strong> will immediately lose access, and the asset will be permanently erased from Google Drive.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
            className="gap-2"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Material
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

