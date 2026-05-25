import {
  Sidebar as FlowbiteSidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import { HiHome, HiUser, HiChevronLeft, HiSpeakerphone } from "react-icons/hi";
import {
  MdLibraryBooks,
  MdGroups,
  MdSecurity,
  MdAssignment,
} from "react-icons/md";
import { VscFeedback } from "react-icons/vsc";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { FaUserCheck } from "react-icons/fa";
import { IoBookSharp } from "react-icons/io5";
import { FiActivity } from "react-icons/fi";
import { memo, useCallback, useMemo } from "react";
import useAuth from "../../hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProps } from "../../utils/Interfaces";
import { IconType } from "react-icons";

interface SidebarNavItem {
  name: string;
  icon: IconType;
  repOnly: boolean;
  repRoute: string;
  studentRoute: string;
  groupId: 1 | 2 | 3;
}

const NAV_ITEMS: SidebarNavItem[] = [
  {
    name: "Dashboard",
    icon: HiHome,
    repOnly: false,
    repRoute: "/reps/dashboard",
    studentRoute: "/students/dashboard",
    groupId: 1,
  },
  {
    name: "Announcements",
    icon: HiSpeakerphone,
    repOnly: true,
    repRoute: "/reps/notifications",
    studentRoute: "",
    groupId: 1,
  },
  {
    name: "Assignment",
    icon: MdAssignment,
    repOnly: false,
    repRoute: "/reps/assignments",
    studentRoute: "/students/assignments",
    groupId: 1,
  },
  {
    name: "Attendance",
    icon: FaUserCheck,
    repOnly: false,
    repRoute: "/reps/attendance",
    studentRoute: "/students/attendance",
    groupId: 1,
  },
  {
    name: "Students",
    icon: HiUser,
    repOnly: true,
    repRoute: "/reps/students",
    studentRoute: "",
    groupId: 1,
  },
  {
    name: "Slides",
    icon: MdLibraryBooks,
    repOnly: false,
    repRoute: "/reps/slides",
    studentRoute: "/students/slides",
    groupId: 2,
  },
  {
    name: "Events",
    icon: FiActivity,
    repOnly: false,
    repRoute: "/reps/events",
    studentRoute: "/students/events",
    groupId: 2,
  },
  {
    name: "Groups",
    icon: MdGroups,
    repOnly: false,
    repRoute: "/reps/groups",
    studentRoute: "/students/groups",
    groupId: 2,
  },
  {
    name: "Lecturers",
    icon: HiMiniAcademicCap,
    repOnly: false,
    repRoute: "/reps/lecturers",
    studentRoute: "/students/lecturers",
    groupId: 2,
  },
  {
    name: "Courses",
    icon: IoBookSharp,
    repOnly: false,
    repRoute: "/reps/courses",
    studentRoute: "/students/courses",
    groupId: 3,
  },
  {
    name: "Feedback",
    icon: VscFeedback,
    repOnly: false,
    repRoute: "/reps/feedbacks",
    studentRoute: "/students/feedbacks",
    groupId: 3,
  },
  {
    name: "Security",
    icon: MdSecurity,
    repOnly: true,
    repRoute: "/reps/security",
    studentRoute: "/students/security",
    groupId: 3,
  },
];

const GROUPS = [1, 2, 3] as const;

const Sidebar = memo(({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleRedirect = useCallback(
    (repPath: string, studentPath: string) => {
      if (window.innerWidth <= 768) toggleSidebar();
      navigate(user?.isRep ? repPath : studentPath);
    },
    [navigate, toggleSidebar, user?.isRep],
  );

  const authorizedItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.repOnly || user?.isRep),
    [user?.isRep],
  );

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 transform bg-gray-700 shadow-lg transition-transform duration-300 ease-in-out md:static md:transform-none dark:bg-gray-900 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <FlowbiteSidebar className="custom-scrollbar-hide h-full overflow-y-auto">
        <div className="mb-2 flex items-center justify-between border-b border-gray-700 p-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {user?.name}
          </h1>
          <button
            aria-label="Close sidebar"
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <HiChevronLeft size={24} />
          </button>
        </div>

        <SidebarItems>
          {GROUPS.map((groupId) => (
            <SidebarItemGroup key={groupId}>
              {authorizedItems
                .filter((item) => item.groupId === groupId)
                .map((item) => {
                  const targetRoute = user?.isRep
                    ? item.repRoute
                    : item.studentRoute;
                  const isActive =
                    !!targetRoute &&
                    (pathname === targetRoute ||
                      pathname.startsWith(targetRoute + "/"));

                  return (
                    <SidebarItem
                      key={item.name}
                      icon={item.icon}
                      active={isActive}
                      className={`cursor-pointer ${
                        isActive
                          ? "bg-gray-400! text-white dark:bg-gray-400!"
                          : "text-gray-800 hover:bg-gray-600"
                      }`}
                      onClick={() =>
                        handleRedirect(item.repRoute, item.studentRoute)
                      }
                    >
                      {item.name}
                    </SidebarItem>
                  );
                })}
            </SidebarItemGroup>
          ))}
        </SidebarItems>
      </FlowbiteSidebar>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
