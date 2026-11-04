import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssignmentDetailQuery, useDownloadSubmission } from '@/hooks/use-assignments';
import type { Assignment } from '@/types';
import {
  FolderOpen,
  ExternalLink,
  Download,
  Search,
  Users,
  FileText,
  Loader2,
  Clock,
} from 'lucide-react';

interface AssignmentSubmissionsSheetProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignmentSubmissionsSheet({
  assignment,
  open,
  onOpenChange,
}: AssignmentSubmissionsSheetProps) {
  const [search, setSearch] = useState('');
  const { downloadSubmission, isDownloading, downloadingId } = useDownloadSubmission();

  const { data: detailData, isLoading } = useAssignmentDetailQuery(
    assignment?.id || '',
    1,
    100,
  );

  const submissions = detailData?.submissions?.items || [];
  const driveFolderUrl = assignment?.submissionFolderId
    ? `https://drive.google.com/drive/folders/${assignment.submissionFolderId}`
    : null;

  const filteredSubmissions = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter(
      (s) =>
        s.studentName?.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.fileName?.toLowerCase().includes(q),
    );
  }, [submissions, search]);

  if (!assignment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <SheetHeader className="border-b border-border pb-4 space-y-1.5 shrink-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="font-mono text-xs bg-primary text-primary-foreground font-bold">
              {assignment.courseId}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {submissions.length} Total Submission{submissions.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <SheetTitle className="text-xl font-bold text-foreground leading-snug">
            {assignment.title}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Student solution repository. Download individual submissions or access the dedicated cloud folder.
          </SheetDescription>

          {/* Drive Native Bulk ZIP Folder Access Ribbon (Approach A) */}
          {driveFolderUrl && (
            <div className="pt-2 flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Google Drive Submissions Vault</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Cloud folder housing all raw solutions
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="text-xs font-semibold h-8 gap-1.5 shrink-0"
                onClick={() => window.open(driveFolderUrl, '_blank', 'noopener,noreferrer')}
                title="Open submissions folder in Google Drive to download all as ZIP"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Drive</span>
              </Button>
            </div>
          )}
        </SheetHeader>

        {/* Filter bar */}
        <div className="pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, ID, or file..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-border rounded-lg bg-muted/20">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm text-foreground">No Submissions Found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {search ? `No submissions matched "${search}".` : 'No students have submitted solutions yet.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">File</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Submitted</TableHead>
                    <TableHead className="text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const isCurrentDownloading = downloadingId === sub.id;
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-xs text-foreground">
                              {sub.studentName || 'Student'}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {sub.studentId}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 min-w-0 max-w-[140px] sm:max-w-[180px]">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-foreground truncate" title={sub.fileName || 'file'}>
                              {sub.fileName || 'Solution File'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-foreground"
                            onClick={() => downloadSubmission(sub.id, sub.fileName || 'solution')}
                            disabled={isDownloading}
                            title="Download Solution"
                          >
                            {isCurrentDownloading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            <span className="sr-only">Download</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
