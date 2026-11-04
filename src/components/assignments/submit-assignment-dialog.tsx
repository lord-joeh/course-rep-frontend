import React, { useState, useRef } from 'react';
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
import { useSubmitAssignmentMutation } from '@/hooks/use-assignments';
import { isPastDeadline, formatDeadlineRemaining } from '@/lib/assignment-validation';
import { formatBytes } from '@/components/google/drive-file-list';
import type { Assignment } from '@/types';
import {
  UploadCloud,
  FileText,
  AlertTriangle,
  Loader2,
  Calendar,
  RefreshCw,
  X,
  FileCheck2,
} from 'lucide-react';

interface SubmitAssignmentDialogProps {
  assignment: Assignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function SubmitAssignmentDialog({
  assignment,
  open,
  onOpenChange,
}: SubmitAssignmentDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitMutation = useSubmitAssignmentMutation(() => {
    resetForm();
    onOpenChange(false);
  });

  const resetForm = () => {
    setSelectedFile(null);
    setValidationError('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  if (!assignment) return null;

  const isExpired = isPastDeadline(assignment.deadline);
  const hasPriorSubmission = assignment.hasSubmitted || Boolean(assignment.studentSubmission);

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setValidationError('');

    if (file.size > MAX_FILE_SIZE) {
      setValidationError(`"${file.name}" exceeds the 50MB limit.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Please select a solution file to submit.');
      return;
    }

    if (isExpired) {
      setValidationError('Cannot submit solution: the assignment deadline has passed.');
      return;
    }

    submitMutation.mutate({
      assignmentId: assignment.id,
      file: selectedFile,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {hasPriorSubmission ? 'Re-Submit Assignment' : 'Submit Assignment Solution'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Upload your solution file to the course repository before deadline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Target Assignment Details */}
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Badge className="font-mono text-[10px] bg-primary text-primary-foreground font-bold">
                {assignment.courseId}
              </Badge>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDeadlineRemaining(assignment.deadline)}
              </span>
            </div>
            <p className="font-bold text-sm text-foreground">
              {assignment.title}
            </p>
          </div>

          {/* Expired Deadline Warning */}
          {isExpired && (
            <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Submission Closed:</strong> The deadline for this assignment has passed. Submissions are locked.
              </span>
            </div>
          )}

          {/* Prior Submission Notice */}
          {hasPriorSubmission && !isExpired && (
            <div className="rounded-md bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2 border border-amber-500/20">
              <RefreshCw className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Prior Submission Detected:</strong> Submitting a new file will automatically clean up and replace your previously uploaded solution.
              </span>
            </div>
          )}

          {/* Drag & Drop File Dropzone */}
          {!isExpired && (
            <div className="space-y-2">
              {selectedFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate max-w-[240px]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setSelectedFile(null)}
                    disabled={submitMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileChange(file);
                    }}
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <FileText className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Click to select or drag & drop solution file
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Supports code archives, PDF, Word documents (up to 50MB)
                  </p>
                </div>
              )}

              {validationError && (
                <p className="text-xs text-destructive">{validationError}</p>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending || isExpired || !selectedFile}
              className="gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  {hasPriorSubmission ? 'Confirm Re-Submit' : 'Submit Solution'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
