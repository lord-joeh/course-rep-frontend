import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Course } from '@/types';
import {
  Calendar,
  Clock,
  GraduationCap,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  UserPlus,
  Loader2,
  Folder,
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
  isRep?: boolean;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
  onEnroll?: (course: Course) => void;
  onUnenroll?: (course: Course) => void;
  onViewRoster?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
}

export function CourseCard({
  course,
  isRep = false,
  isEnrolled = false,
  isEnrolling = false,
  onEnroll,
  onUnenroll,
  onViewRoster,
  onEdit,
  onDelete,
}: CourseCardProps) {
  const [hoverUnenroll, setHoverUnenroll] = useState(false);

  const formattedSchedule =
    course.day || course.startTime || course.endTime
      ? `${course.day || 'TBD'} ${course.startTime ? `(${course.startTime} - ${course.endTime || 'TBD'})` : ''}`
      : 'Schedule not announced';

  return (
    <Card className="flex flex-col justify-between border-border bg-card transition-shadow hover:shadow-md">
      <CardContent className="p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="font-mono font-bold tracking-wider text-xs bg-primary text-primary-foreground">
                {course.id}
              </Badge>
              <Badge variant="outline" className="text-[11px] font-medium text-muted-foreground">
                {course.semester}
              </Badge>
            </div>
            <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 pt-1" title={course.name}>
              {course.name}
            </h3>
          </div>

          {/* Rep Admin Actions Dropdown */}
          {isRep && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Course options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewRoster?.(course)}>
                  <Users className="mr-2 h-4 w-4" />
                  View Enrolled Roster
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(course)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Course Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(course)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Course Details Block */}
        <div className="space-y-2 pt-1 border-t border-border/60 text-xs text-muted-foreground">
          {/* Assigned Faculty */}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 shrink-0 text-foreground/70" />
            {course.lecturer ? (
              <span className="font-medium text-foreground truncate" title={course.lecturer.name}>
                {course.lecturer.name}
              </span>
            ) : (
              <span className="italic text-muted-foreground">No faculty instructor assigned</span>
            )}
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-2">
            {course.day ? (
              <Calendar className="h-4 w-4 shrink-0 text-foreground/70" />
            ) : (
              <Clock className="h-4 w-4 shrink-0 text-foreground/70" />
            )}
            <span className="truncate">{formattedSchedule}</span>
          </div>

          {/* Slides Folder ID indicator */}
          {course.slidesFolderId && (
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 shrink-0 text-foreground/70" />
              <span className="font-mono truncate">Drive Vault Linked</span>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
          {isRep ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold"
              onClick={() => onViewRoster?.(course)}
            >
              <Users className="mr-1.5 h-3.5 w-3.5" />
              View Roster
            </Button>
          ) : (
            isEnrolled ? (
              <Button
                variant={hoverUnenroll ? 'destructive' : 'secondary'}
                size="sm"
                className="w-full text-xs font-semibold transition-colors"
                onMouseEnter={() => setHoverUnenroll(true)}
                onMouseLeave={() => setHoverUnenroll(false)}
                onClick={() => onUnenroll?.(course)}
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : hoverUnenroll ? (
                  'Unenroll from Course'
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    Enrolled
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full text-xs font-semibold"
                onClick={() => onEnroll?.(course)}
                disabled={isEnrolling}
              >
                {isEnrolling ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    Enroll in Course
                  </>
                )}
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}

