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
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SidebarProps } from "../../utils/Interfaces";
import { IconType } from "react-icons";
import { useRef } from "react";

interface IsidebarItem {
  name: string;
  icon: IconType;
  isRepRoute: boolean;
  repRoute: string;
  studentRoute: string;
}

const Sidebar = ({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeSideItem = useRef("Dashboard");

  const handleRedirect = (repPath: string, studentPath: string) => {
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
    navigate(user?.isRep ? repPath : studentPath);
  };

  const navItems: IsidebarItem[] = [
    {
      name: "Dashboard",
      icon: HiHome,
      isRepRoute: false,
      repRoute: "/reps/dashboard",
      studentRoute: "/students/dashboard",
    },
    {
      name: "Announcements",
      icon: HiSpeakerphone,
      isRepRoute: true,
      repRoute: "/reps/notifications",
      studentRoute: "",
    },
    {
      name: "Assignment",
      icon: MdAssignment,
      isRepRoute: false,
      repRoute: "/reps/assignments",
      studentRoute: "/students/assignments",
    },
    {
      name: "Attendance",
      icon: FaUserCheck,
      isRepRoute: false,
      repRoute: "/reps/attendance",
      studentRoute: "/students/attendance",
    },
    {
      name: "Students",
      icon: HiUser,
      isRepRoute: true,
      repRoute: "/reps/students",
      studentRoute: "",
    },
    {
      name: "Slide",
      icon: MdLibraryBooks,
      isRepRoute: false,
      repRoute: "/reps/slides",
      studentRoute: "/students/slides",
    },
    {
      name: "Events",
      icon: FiActivity,
      isRepRoute: false,
      repRoute: "/reps/events",
      studentRoute: "/students/events",
    },
    {
      name: "Groups",
      icon: MdGroups,
      isRepRoute: false,
      repRoute: "/reps/groups",
      studentRoute: "/students/groups",
    },
    {
      name: "Lecturers",
      icon: HiMiniAcademicCap,
      isRepRoute: false,
      repRoute: "/reps/lecturers",
      studentRoute: "/students/lecturers",
    },
    {
      name: "Courses",
      icon: IoBookSharp,
      isRepRoute: false,
      repRoute: "/reps/courses",
      studentRoute: "/students/courses",
    },
    {
      name: "Feedback",
      icon: VscFeedback,
      isRepRoute: false,
      repRoute: "/reps/feedbacks",
      studentRoute: "/students/feedbacks",
    },
    {
      name: "Security",
      icon: MdSecurity,
      isRepRoute: true,
      repRoute: "/reps/security",
      studentRoute: "/students/security",
    },
  ];
  const authorizedRoute = navItems.filter(
    (route) => !(route?.isRepRoute && !user?.isRep),
  );

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 transform bg-gray-700 shadow-lg transition-transform duration-300 ease-in-out md:transform-none dark:bg-gray-900 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:static`}
    >
      <FlowbiteSidebar className="custom-scrollbar-hide h-full overflow-y-auto">
        <div className="mb-2 flex items-center justify-between border-b border-gray-700 p-4 dark:border-gray-700">
          <h1 className="flex flex-wrap text-xl font-bold text-gray-900 dark:text-white">
            {user && user?.name}
          </h1>
          <button
            aria-label="toggle-sidebar"
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <HiChevronLeft size={24} />
          </button>
        </div>
        <SidebarItems>
          <SidebarItemGroup>
            {authorizedRoute.slice(0, 5).map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                className={`cursor-pointer ${item.name === activeSideItem.current ? "bg-gray-300 dark:text-gray-800" : ""}`}
                onClick={() => {
                  handleRedirect(item.repRoute, item.studentRoute);
                  activeSideItem.current = item.name;
                }}
              >
                {item?.name}
              </SidebarItem>
            ))}
          </SidebarItemGroup>

          <SidebarItemGroup>
            {authorizedRoute.slice(6, 9).map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                className={`cursor-pointer ${item.name === activeSideItem.current ? "bg-gray-300 dark:text-gray-800" : ""}`}
                onClick={() => {
                  handleRedirect(item.repRoute, item.studentRoute);
                  activeSideItem.current = item.name;
                }}
              >
                {item?.name}
              </SidebarItem>
            ))}
          </SidebarItemGroup>

          <SidebarItemGroup>
            {authorizedRoute.slice(10).map((item) => (
              <SidebarItem
                key={item.name}
                icon={item.icon}
                className={`cursor-pointer ${item.name === activeSideItem.current ? "bg-gray-300 dark:text-gray-800" : ""}`}
                onClick={() => {
                  handleRedirect(item.repRoute, item.studentRoute);
                  activeSideItem.current = item.name;
                }}
              >
                {item?.name}
              </SidebarItem>
            ))}
          </SidebarItemGroup>
        </SidebarItems>
      </FlowbiteSidebar>
    </div>
  );
};

export default Sidebar;
