import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDownloadSlide } from '@/hooks/use-slides';
import { isVideoFile, isPresentationFile, isPdfFile } from '@/lib/slide-validation';
import type { Slide } from '@/types';
import {
  FileText,
  Video,
  Presentation,
  File,
  Download,
  Eye,
  Trash2,
  Loader2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface SlideCardProps {
  slide: Slide;
  isRep?: boolean;
  onPreview?: (slide: Slide) => void;
  onDelete?: (slide: Slide) => void;
}

function getSlideMediaIcon(fileName: string) {
  if (isVideoFile(fileName)) {
    return <Video className="h-6 w-6 text-cyan-500 shrink-0" />;
  }
  if (isPresentationFile(fileName)) {
    return <Presentation className="h-6 w-6 text-amber-500 shrink-0" />;
  }
  if (isPdfFile(fileName)) {
    return <FileText className="h-6 w-6 text-red-500 shrink-0" />;
  }
  return <File className="h-6 w-6 text-muted-foreground shrink-0" />;
}

export function SlideCard({
  slide,
  isRep = false,
  onPreview,
  onDelete,
}: SlideCardProps) {
  const { downloadSlide, isDownloading, downloadingSlideId } = useDownloadSlide();
  const isVideo = isVideoFile(slide.fileName);
  const isCurrentDownloading = downloadingSlideId === slide.id;
  const isPending = !slide.driveFileId || slide.driveFileId === 'pending';

  return (
    <Card className="flex flex-col justify-between border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/60 border border-border">
              {getSlideMediaIcon(slide.fileName)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className="font-mono text-[10px] bg-primary text-primary-foreground font-bold">
                  {slide.courseId}
                </Badge>
                {isVideo && (
                  <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">
                    Video Lecture
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium animate-pulse">
                    <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin inline" />
                    Syncing...
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2 pt-1" title={slide.fileName}>
                {slide.fileName}
              </h3>
            </div>
          </div>

          {/* Delete Action (Rep Only) */}
          {isRep && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
              onClick={() => onDelete?.(slide)}
              title="Delete Slide"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>

        {/* Metadata Details */}
        <div className="space-y-1.5 pt-1 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(slide.createdAt).toLocaleDateString()}
            </span>

            {slide.hash && (
              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80" title={`SHA-256: ${slide.hash}`}>
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: In-Browser Preview & Streaming Download */}
        <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-semibold h-8"
            onClick={() => onPreview?.(slide)}
            disabled={isPending}
            title={isPending ? 'Syncing to cloud storage...' : undefined}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Syncing...' : isVideo ? 'Watch Video' : 'Preview'}
          </Button>

          <Button
            size="sm"
            className="text-xs font-semibold h-8"
            onClick={() => downloadSlide(slide.id, slide.fileName)}
            disabled={isDownloading || isPending}
            title={isPending ? 'Syncing to cloud storage...' : undefined}
          >
            {isCurrentDownloading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 h-3.5 w-3.5" />
            )}
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

