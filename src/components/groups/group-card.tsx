import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Group } from '@/types';
import {
  Users,
  Crown,
  BookOpen,
  Globe,
  MoreVertical,
  Edit2,
  UserPlus,
  Trash2,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

interface GroupCardProps {
  group: Group;
  isRep?: boolean;
  currentUserId?: string;
  onViewRoster: (group: Group) => void;
  onEdit?: (group: Group) => void;
  onDelete?: (group: Group) => void;
}

export function GroupCard({
  group,
  isRep = false,
  currentUserId,
  onViewRoster,
  onEdit,
  onDelete,
}: GroupCardProps) {
  // Find designated group leader if members are loaded
  const leader = group.members?.find((m) => m.isLeader);
  const isCurrentUserLeader = Boolean(
    currentUserId && leader && leader.studentId === currentUserId,
  );
  const memberCount = group.members?.length ?? group.memberCount ?? 0;

  return (
    <Card
      className="flex flex-col justify-between hover:shadow-md transition-shadow border-border bg-card"
      data-testid={`group-card-${group.id}`}
    >
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              {group.isGeneral ? (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-2 py-0.5 border-border bg-muted/30 text-muted-foreground flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-muted-foreground" /> General Cohort
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] px-2 py-0.5 border-border bg-primary/10 text-primary font-semibold flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3 text-primary" />
                  {group.course?.id || group.courseId || 'Course Specific'}
                </Badge>
              )}

              {isCurrentUserLeader && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] px-1.5 py-0.5 flex items-center gap-1 font-semibold">
                  <Crown className="w-3 h-3 fill-amber-500 text-amber-500" />
                  You are Leader
                </Badge>
              )}
            </div>

            <CardTitle className="text-base font-bold text-foreground tracking-tight line-clamp-1 pt-1">
              {group.name}
            </CardTitle>

            {group.course?.name && !group.isGeneral && (
              <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                {group.course.name}
              </p>
            )}
          </div>

          {isRep && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  aria-label="Group options"
                  data-testid="group-options-trigger"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => onViewRoster(group)}
                  className="text-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-2" />
                  Manage Roster
                </DropdownMenuItem>
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(group)}
                    className="text-xs cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(group)}
                    className="text-xs cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {group.description && (
          <CardDescription className="text-xs text-muted-foreground line-clamp-2 pt-1 leading-relaxed">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-5 pt-0 space-y-3 mt-auto">
        {/* Leader & Member Count Highlights */}
        <div className="flex items-center justify-between p-2.5 rounded bg-muted/20 border border-border text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-semibold text-foreground">{memberCount}</span>
            <span className="text-muted-foreground">students</span>
          </div>

          {leader ? (
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate max-w-[150px]">
              <Crown className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
              <span className="truncate" title={leader.student?.name || leader.studentId}>
                {leader.student?.name || leader.studentId}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">No leader designated</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span>
              {group.createdAt ? format(new Date(group.createdAt), 'MMM d, yyyy') : 'Recent'}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewRoster(group)}
            className="h-7 text-xs font-medium border-border"
            data-testid="view-roster-btn"
          >
            View Roster
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

