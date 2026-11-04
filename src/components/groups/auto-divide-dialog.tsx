import React, { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { useAutoDivideGroupsMutation } from '@/hooks/use-groups';
import { useCoursesQuery } from '@/hooks/use-courses';
import { autoDivideGroupsSchema } from '@/lib/group-validation';
import {
  Sparkles,
  Shuffle,
  Loader2,
  BookOpen,
  Globe,
  Crown,
  Info,
} from 'lucide-react';

interface AutoDivideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCourseId?: string;
  onSuccess?: () => void;
}

export function AutoDivideDialog({
  open,
  onOpenChange,
  defaultCourseId = '',
  onSuccess,
}: AutoDivideDialogProps) {
  const [isGeneral, setIsGeneral] = useState(false);
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [partitionMode, setPartitionMode] = useState<'bySize' | 'byCount'>('bySize');
  const [studentsPerGroup, setStudentsPerGroup] = useState<number>(5);
  const [numberOfGroups, setNumberOfGroups] = useState<number>(4);
  const [namingPrefix, setNamingPrefix] = useState('Group');
  const [autoAssignLeader, setAutoAssignLeader] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: coursesData } = useCoursesQuery();
  const courses = coursesData?.items || [];

  const autoDivideMutation = useAutoDivideGroupsMutation(() => {
    handleClose();
    if (onSuccess) onSuccess();
  });

  const handleClose = () => {
    setIsGeneral(false);
    setCourseId(defaultCourseId);
    setPartitionMode('bySize');
    setStudentsPerGroup(5);
    setNumberOfGroups(4);
    setNamingPrefix('Group');
    setAutoAssignLeader(true);
    setErrors({});
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = autoDivideGroupsSchema.safeParse({
      isGeneral,
      courseId: isGeneral ? undefined : courseId,
      partitionMode,
      studentsPerGroup: partitionMode === 'bySize' ? Number(studentsPerGroup) : undefined,
      numberOfGroups: partitionMode === 'byCount' ? Number(numberOfGroups) : undefined,
      namingPrefix: namingPrefix.trim() || 'Group',
      autoAssignLeader,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path[0]?.toString() || 'form';
        fieldErrors[path] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    autoDivideMutation.mutate({
      isGeneral,
      courseId: isGeneral ? undefined : courseId,
      studentsPerGroup: partitionMode === 'bySize' ? Number(studentsPerGroup) : undefined,
      numberOfGroups: partitionMode === 'byCount' ? Number(numberOfGroups) : undefined,
      namingPrefix: namingPrefix.trim() || 'Group',
      autoAssignLeader,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card text-card-foreground p-6 border border-border shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Auto-Divide Students Engine
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Partition students into study groups using the Fisher-Yates uniform shuffle algorithm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Cohort Scope Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Cohort Source</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsGeneral(false);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.courseId;
                    return next;
                  });
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-semibold transition-colors ${
                  !isGeneral
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
                data-testid="scope-course-btn"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Enrolled Course Roster
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsGeneral(true);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.courseId;
                    return next;
                  });
                }}
                className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-semibold transition-colors ${
                  isGeneral
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
                data-testid="scope-general-btn"
              >
                <Globe className="w-3.5 h-3.5" />
                General Cohort (All Students)
              </button>
            </div>
          </div>

          {/* Course Dropdown (if course-specific) */}
          {!isGeneral && (
            <div className="space-y-1.5">
              <Label htmlFor="auto-divide-course" className="text-xs font-semibold">
                Target Course <span className="text-destructive">*</span>
              </Label>
              <select
                id="auto-divide-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className={`w-full h-9 px-3 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${
                  errors.courseId ? 'border-destructive' : ''
                }`}
                data-testid="auto-divide-course-select"
              >
                <option value="">-- Select Course Roster to Partition --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
              {errors.courseId && <p className="text-[11px] text-destructive">{errors.courseId}</p>}
            </div>
          )}

          {/* Partition Mode Tabs */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Partition Strategy</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPartitionMode('bySize')}
                className={`p-2 rounded border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  partitionMode === 'bySize'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
                data-testid="mode-by-size-btn"
              >
                <Shuffle className="w-3.5 h-3.5" />
                By Group Size
              </button>
              <button
                type="button"
                onClick={() => setPartitionMode('byCount')}
                className={`p-2 rounded border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                  partitionMode === 'byCount'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
                data-testid="mode-by-count-btn"
              >
                <Shuffle className="w-3.5 h-3.5" />
                By Number of Groups
              </button>
            </div>
          </div>

          {/* Mode-specific Input */}
          {partitionMode === 'bySize' ? (
            <div className="space-y-1.5">
              <Label htmlFor="students-per-group" className="text-xs font-semibold">
                Students per Group <span className="text-destructive">*</span>
              </Label>
              <Input
                id="students-per-group"
                type="number"
                min={2}
                max={100}
                value={studentsPerGroup}
                onChange={(e) => setStudentsPerGroup(parseInt(e.target.value) || 0)}
                className={`h-9 text-xs border-border ${
                  errors.studentsPerGroup ? 'border-destructive' : ''
                }`}
                data-testid="students-per-group-input"
              />
              <p className="text-[10px] text-muted-foreground">
                Engine will form groups with approximately this size.
              </p>
              {errors.studentsPerGroup && (
                <p className="text-[11px] text-destructive">{errors.studentsPerGroup}</p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="number-of-groups" className="text-xs font-semibold">
                Total Number of Groups <span className="text-destructive">*</span>
              </Label>
              <Input
                id="number-of-groups"
                type="number"
                min={2}
                max={100}
                value={numberOfGroups}
                onChange={(e) => setNumberOfGroups(parseInt(e.target.value) || 0)}
                className={`h-9 text-xs border-border ${
                  errors.numberOfGroups ? 'border-destructive' : ''
                }`}
                data-testid="number-of-groups-input"
              />
              <p className="text-[10px] text-muted-foreground">
                Engine will distribute all students uniformly into exactly this many groups.
              </p>
              {errors.numberOfGroups && (
                <p className="text-[11px] text-destructive">{errors.numberOfGroups}</p>
              )}
            </div>
          )}

          {/* Group Naming Prefix */}
          <div className="space-y-1.5">
            <Label htmlFor="naming-prefix" className="text-xs font-semibold">
              Group Naming Prefix
            </Label>
            <Input
              id="naming-prefix"
              placeholder="e.g. Group, Team, Squad"
              value={namingPrefix}
              onChange={(e) => setNamingPrefix(e.target.value)}
              className="h-9 text-xs border-border"
              data-testid="naming-prefix-input"
            />
            <p className="text-[10px] text-muted-foreground">
              Generated names will be formatted as &ldquo;{namingPrefix || 'Group'} 1&rdquo;, &ldquo;
              {namingPrefix || 'Group'} 2&rdquo;, etc.
            </p>
          </div>

          {/* Auto-Assign Leadership Toggle */}
          <div className="flex items-center gap-2 p-3 rounded border border-border bg-muted/20">
            <input
              type="checkbox"
              id="auto-assign-leader"
              checked={autoAssignLeader}
              onChange={(e) => setAutoAssignLeader(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-border cursor-pointer"
              data-testid="auto-assign-leader-checkbox"
            />
            <Label
              htmlFor="auto-assign-leader"
              className="text-xs font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Randomly designate one group member as Group Leader</span>
            </Label>
          </div>

          {/* Algorithmic Guarantees Callout */}
          <div className="p-3 rounded border border-primary/20 bg-primary/5 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <Info className="w-3.5 h-3.5" />
              Algorithmic Integrity
            </div>
            <p className="text-[11px] leading-relaxed">
              Every student has an equal mathematical probability of group placement via Fisher-Yates
              in-place shuffling. Any existing groups for this cohort will be cleanly replaced with
              full transactional rollback safety.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={autoDivideMutation.isPending}
              className="text-xs border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={autoDivideMutation.isPending}
              className="text-xs bg-primary text-primary-foreground font-semibold"
              data-testid="execute-auto-divide-btn"
            >
              {autoDivideMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Partitioning Students...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Execute Division
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

