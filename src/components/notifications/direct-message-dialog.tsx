import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSendDirectNotificationMutation } from '@/hooks/use-notifications';
import { useStudentsQuery } from '@/hooks/use-students';
import { directNotificationSchema } from '@/lib/notification-validation';
import type { Student } from '@/types';
import { Send, User, Search, Loader2, X } from 'lucide-react';

interface DirectMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStudentId?: string;
  defaultStudentName?: string;
}

export function DirectMessageDialog({
  isOpen,
  onClose,
  defaultStudentId = '',
  defaultStudentName = '',
}: DirectMessageDialogProps) {
  // Selected student state
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    email?: string;
  } | null>(null);

  // Search input state with 300ms debounce
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'in_app' | 'email' | 'sms'>('in_app');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query matching students with debounced query (limit to top 10 matches)
  const { data: studentsData, isLoading: isSearching } = useStudentsQuery({
    search: debouncedSearch.trim() || undefined,
    limit: 10,
  });
  const searchResults: Student[] = debouncedSearch.trim() ? studentsData?.items || [] : [];

  const sendDirectMutation = useSendDirectNotificationMutation();

  // Reset dialog state on open
  useEffect(() => {
    if (isOpen) {
      if (defaultStudentId && defaultStudentName) {
        setSelectedStudent({
          id: defaultStudentId,
          name: defaultStudentName,
        });
      } else {
        setSelectedStudent(null);
      }
      setSearchQuery('');
      setDebouncedSearch('');
      setTitle('');
      setMessage('');
      setMessageType('in_app');
      setValidationErrors({});
    }
  }, [isOpen, defaultStudentId, defaultStudentName]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent({
      id: student.id,
      name: student.name,
      email: student.email,
    });
    setSearchQuery('');
    setDebouncedSearch('');
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next.studentId;
      return next;
    });
  };

  const handleClearSelectedStudent = () => {
    setSelectedStudent(null);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (!selectedStudent?.id) {
      setValidationErrors({ studentId: 'Please search and select a recipient student.' });
      return;
    }

    const payload = {
      studentId: selectedStudent.id.trim(),
      title: title.trim() || undefined,
      message: message.trim(),
      messageType,
    };

    const parsed = directNotificationSchema.safeParse(payload);
    if (!parsed.success) {
      const errMap: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() || 'general';
        errMap[key] = issue.message;
      });
      setValidationErrors(errMap);
      return;
    }

    try {
      await sendDirectMutation.mutateAsync(parsed.data);
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
            <Send className="w-5 h-5 text-primary" />
            Send Direct Student Alert
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Dispatch a targeted, private alert directly to a student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Recipient Student Selection (Debounced Search) */}
          <div className="space-y-1.5">
            <Label htmlFor="student-search" className="text-xs font-semibold">
              Recipient Student <span className="text-destructive">*</span>
            </Label>

            {selectedStudent ? (
              // Selected Student Card
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/30 bg-primary/5 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {selectedStudent.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                      <span className="font-mono">ID: {selectedStudent.id}</span>
                      {selectedStudent.email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{selectedStudent.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelectedStudent}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground shrink-0"
                >
                  Change
                </Button>
              </div>
            ) : (
              // Search Input with Debounced Autocomplete
              <div className="space-y-1">
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <Input
                    id="student-search"
                    placeholder="Search by name, student ID, or email..."
                    className="pl-9 pr-8 h-9 text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin absolute right-3 top-3" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                {/* Search Results Dropdown */}
                {debouncedSearch.trim() && (
                  <div className="rounded-md border border-border bg-popover shadow-md max-h-44 overflow-y-auto divide-y divide-border/60">
                    {isSearching ? (
                      <div className="p-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                        <span>Searching directory...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">
                        No students found matching &quot;{debouncedSearch}&quot;
                      </div>
                    ) : (
                      searchResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleSelectStudent(student)}
                          className="w-full text-left p-2.5 hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate">
                              {student.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              {student.email}
                            </div>
                          </div>
                          <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                            {student.id}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {validationErrors.studentId && (
              <p className="text-xs text-destructive">{validationErrors.studentId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="direct-title" className="text-xs font-semibold">
                Title (Optional)
              </Label>
              <Input
                id="direct-title"
                placeholder="e.g. Lab Attendance Notice"
                className="h-9 text-xs"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="direct-type" className="text-xs font-semibold">
                Delivery Channel
              </Label>
              <select
                id="direct-type"
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as 'in_app' | 'email' | 'sms')}
              >
                <option value="in_app">In-App & Push (Default)</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="direct-message" className="text-xs font-semibold">
              Direct Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="direct-message"
              placeholder="Write your private message or warning to this student..."
              className="min-h-[100px] text-xs resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            {validationErrors.message && (
              <p className="text-xs text-destructive">{validationErrors.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={sendDirectMutation.isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sendDirectMutation.isPending}
              className="gap-1.5 text-xs h-9"
            >
              {sendDirectMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Alert</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
