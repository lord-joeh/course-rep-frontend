import React, { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useGroupDetailQuery,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useSetGroupLeaderMutation,
} from '@/hooks/use-groups';
import { useCourseRosterQuery } from '@/hooks/use-courses';
import { useStudentsQuery } from '@/hooks/use-students';
import type { Group } from '@/types';
import {
  Users,
  Crown,
  Search,
  UserPlus,
  Trash2,
  Download,
  Loader2,
  BookOpen,
  Globe,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupRosterSheetProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRep?: boolean;
}

export function GroupRosterSheet({
  group,
  open,
  onOpenChange,
  isRep = false,
}: GroupRosterSheetProps) {
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Group Details with Member Roster
  const { data: groupDetail, isLoading } = useGroupDetailQuery(group?.id);
  const members = groupDetail?.members || group?.members || [];

  // Available students to add: if course-specific, use course roster, else all students
  const { data: courseStudents = [] } = useCourseRosterQuery(
    group?.courseId || undefined,
  );
  const { data: allStudentsData } = useStudentsQuery({ limit: 100 });
  const allStudents = allStudentsData?.items || [];

  const availableCandidates = useMemo(() => {
    const pool = group?.courseId ? courseStudents : allStudents;
    const existingMemberIds = new Set(members.map((m) => m.studentId));
    return pool.filter((s) => !existingMemberIds.has(s.id));
  }, [group?.courseId, courseStudents, allStudents, members]);

  // Mutations
  const addMutation = useAddGroupMemberMutation(() => {
    setSelectedStudentId('');
    setIsAddingMember(false);
  });

  const removeMutation = useRemoveGroupMemberMutation();
  const leaderMutation = useSetGroupLeaderMutation();

  // Filtered members by search
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.toLowerCase();
      const name = m.student?.name?.toLowerCase() || '';
      const indexNum = m.student?.indexNumber?.toLowerCase() || '';
      const studentId = m.studentId?.toLowerCase() || '';
      return name.includes(q) || indexNum.includes(q) || studentId.includes(q);
    });
  }, [members, search]);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || !selectedStudentId) return;

    addMutation.mutate({
      id: group.id,
      dto: { studentId: selectedStudentId, isLeader: false },
    });
  };

  const handleRemoveMember = (studentId: string) => {
    if (!group) return;
    removeMutation.mutate({
      id: group.id,
      studentId,
    });
  };

  const handleSetLeader = (studentId: string) => {
    if (!group) return;
    leaderMutation.mutate({
      id: group.id,
      studentId,
    });
  };

  // CSV Export for this Group Roster
  const handleExportCsv = () => {
    if (!group || members.length === 0) {
      toast.error('No group members to export');
      return;
    }

    const headers = ['Student ID', 'Student Name', 'Index Number', 'Email', 'Role', 'Joined At'];
    const rows = members.map((m) => [
      `"${m.studentId}"`,
      `"${m.student?.name || 'Enrolled Student'}"`,
      `"${m.student?.indexNumber || m.studentId}"`,
      `"${m.student?.email || ''}"`,
      `"${m.isLeader ? 'Group Leader' : 'Member'}"`,
      `"${m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Group roster CSV downloaded');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card text-card-foreground p-0 border-l border-border flex flex-col h-full shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold tracking-tight text-foreground truncate">
                {group?.name || 'Group Roster'}
              </SheetTitle>
              <div className="flex items-center gap-2 pt-0.5">
                {group?.isGeneral ? (
                  <Badge variant="outline" className="text-[10px] font-mono border-border bg-muted/30">
                    <Globe className="w-3 h-3 mr-1 text-muted-foreground" /> General Cohort
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-mono border-border bg-primary/10 text-primary">
                    <BookOpen className="w-3 h-3 mr-1" /> {group?.courseId}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          </div>

          <SheetDescription className="text-xs text-muted-foreground">
            Manage assigned students, transfer leadership, or export the membership list.
          </SheetDescription>

          <div className="flex items-center gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search member name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs border-border bg-background"
                data-testid="roster-search-input"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              className="h-8 text-xs border-border shrink-0"
              title="Download Roster CSV"
              data-testid="export-group-roster-btn"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
          </div>
        </SheetHeader>

        {/* Rep Action: Add Member Form */}
        {isRep && (
          <div className="p-4 bg-muted/20 border-b border-border">
            {!isAddingMember ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingMember(true)}
                className="w-full h-8 text-xs font-semibold border-dashed border-primary/40 text-primary hover:bg-primary/5"
                data-testid="show-add-member-form-btn"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add Student to Group
              </Button>
            ) : (
              <form onSubmit={handleAddMember} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Select Student to Add</span>
                  <button
                    type="button"
                    onClick={() => setIsAddingMember(false)}
                    className="text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="flex-1 h-8 px-2.5 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    data-testid="add-member-select"
                  >
                    <option value="">-- Choose Eligible Student --</option>
                    {availableCandidates.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id})
                      </option>
                    ))}
                  </select>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!selectedStudentId || addMutation.isPending}
                    className="h-8 text-xs bg-primary text-primary-foreground font-semibold px-3"
                    data-testid="confirm-add-member-btn"
                  >
                    {addMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Add'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Member Roster List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-muted-foreground space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading group roster...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              {search ? 'No members match your search.' : 'No students assigned to this group yet.'}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.studentId}
                className="flex items-center justify-between p-3 rounded border border-border bg-card hover:bg-muted/30 transition-colors text-xs"
                data-testid={`member-row-${member.studentId}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      member.isLeader
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {member.student?.name ? member.student.name.charAt(0).toUpperCase() : 'S'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-foreground truncate">
                        {member.student?.name || member.studentId}
                      </span>
                      {member.isLeader && (
                        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[9px] px-1 py-0 flex items-center gap-0.5 font-bold">
                          <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Leader
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate pt-0.5">
                      <span>{member.student?.indexNumber || member.studentId}</span>
                      {member.student?.email && (
                        <>
                          <span>•</span>
                          <span className="truncate flex items-center gap-0.5">
                            <Mail className="w-3 h-3" /> {member.student.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rep Controls: Designate Leader & Remove */}
                {isRep && (
                  <div className="flex items-center gap-1 shrink-0">
                    {!member.isLeader ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetLeader(member.studentId)}
                        disabled={leaderMutation.isPending}
                        className="h-7 px-2 text-[11px] text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10"
                        title="Promote to Group Leader"
                        data-testid={`make-leader-btn-${member.studentId}`}
                      >
                        <Crown className="w-3 h-3 mr-1 text-muted-foreground" /> Make Leader
                      </Button>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 px-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-500" /> Leader
                      </span>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.studentId)}
                      disabled={removeMutation.isPending}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove from Group"
                      data-testid={`remove-member-btn-${member.studentId}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

