import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bell,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  ClipboardList,
  QrCode,
  Network,
  Calendar,
  MessageSquare,
  ShieldAlert,
  Activity,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  repOnly?: boolean;
}

export const REP_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/reps/dashboard', icon: LayoutDashboard },
  { title: 'Announcements', href: '/reps/notifications', icon: Bell },
  { title: 'Students', href: '/reps/students', icon: Users, repOnly: true },
  { title: 'Lecturers', href: '/reps/lecturers', icon: GraduationCap },
  { title: 'Courses', href: '/reps/courses', icon: BookOpen },
  { title: 'Course Slides', href: '/reps/slides', icon: FileText },
  { title: 'Assignments', href: '/reps/assignments', icon: ClipboardList },
  { title: 'Attendance', href: '/reps/attendance', icon: QrCode },
  { title: 'Study Groups', href: '/reps/groups', icon: Network },
  { title: 'Timetable & Events', href: '/reps/events', icon: Calendar },
  { title: 'Feedback Box', href: '/reps/feedback', icon: MessageSquare },
  { title: 'Security Audit', href: '/reps/audit-logs', icon: ShieldAlert, repOnly: true },
  { title: 'Queue Admin', href: '/reps/queues', icon: Activity, repOnly: true },
];

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/students/dashboard', icon: LayoutDashboard },
  { title: 'My Profile', href: '/students/profile', icon: Users },
  { title: 'My Courses', href: '/students/courses', icon: BookOpen },
  { title: 'Course Slides', href: '/students/slides', icon: FileText },
  { title: 'Assignments', href: '/students/assignments', icon: ClipboardList },
  { title: 'Attendance', href: '/students/attendance', icon: QrCode },
  { title: 'Study Groups', href: '/students/groups', icon: Network },
  { title: 'Timetable & Events', href: '/students/events', icon: Calendar },
  { title: 'Feedback', href: '/students/feedback', icon: MessageSquare },
];

interface SidebarProps {
  isRep?: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onItemClick?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isRep = false,
  collapsed,
  onToggleCollapse,
  onItemClick,
  className,
}) => {
  const items = isRep ? REP_NAV_ITEMS : STUDENT_NAV_ITEMS;

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
              CR
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-foreground">CourseRep</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {isRep ? 'Representative' : 'Student Portal'}
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            CR
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onItemClick}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2',
                )
              }
              title={collapsed ? item.title : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="border-t border-border p-2 hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
};
