import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDownloadSlide } from '@/hooks/use-slides';
import { isVideoFile } from '@/lib/slide-validation';
import type { Slide } from '@/types';
import { Download, ExternalLink, Video, FileText, Loader2 } from 'lucide-react';

interface MaterialPreviewDialogProps {
  slide: Slide | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialPreviewDialog({
  slide,
  open,
  onOpenChange,
}: MaterialPreviewDialogProps) {
  const { downloadSlide, isDownloading, downloadingSlideId } = useDownloadSlide();

  if (!slide) return null;

  const isVideo = isVideoFile(slide.fileName);
  const previewUrl = `https://drive.google.com/file/d/${slide.driveFileId}/preview`;
  const isCurrentDownloading = downloadingSlideId === slide.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[88vh] flex flex-col p-4 sm:p-6 gap-3">
        {/* Header with Title & Download action */}
        <DialogHeader className="flex flex-row items-center justify-between gap-3 border-b border-border pb-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              {isVideo ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold text-foreground truncate max-w-md sm:max-w-lg">
                  {slide.fileName}
                </DialogTitle>
                <Badge variant="outline" className="text-[11px] font-mono shrink-0">
                  {slide.courseId}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isVideo ? 'Interactive Video Player' : 'Document & Slide Presentation Viewer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
              title="Open full view in new tab"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </Button>
            <Button
              size="sm"
              className="text-xs h-8"
              onClick={() => downloadSlide(slide.id, slide.fileName)}
              disabled={isDownloading}
            >
              {isCurrentDownloading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Embedded In-Browser Viewer Frame */}
        <div className="flex-1 w-full rounded-lg border border-border bg-black/5 dark:bg-black/40 overflow-hidden relative">
          <iframe
            src={previewUrl}
            title={slide.fileName}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

