import {
  Sidebar as FlowbiteSidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import { HiHome, HiUser, HiChevronLeft } from "react-icons/hi";
import {
  MdLibraryBooks,
  MdGroups,
  MdSecurity,
  MdAssignment,
} from "react-icons/md";
import { VscFeedback } from "react-icons/vsc";
import { RiLogoutCircleLine } from "react-icons/ri";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { FaUserCheck } from "react-icons/fa";
import { IoBookSharp } from "react-icons/io5";
import { FiActivity } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SidebarProps } from "../../utils/Interfaces";

const Sidebar = ({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (repPath: string, studentPath: string) => {
     if (window.innerWidth <= 768) {
      toggleSidebar()
    }
    navigate(user?.isRep ? repPath : studentPath);
   
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 transform bg-gray-700 shadow-lg transition-transform duration-300 ease-in-out md:transform-none dark:bg-gray-900 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:static`}
    >
      <FlowbiteSidebar className="custom-scrollbar-hide h-full overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-700 p-4 dark:border-gray-700">
          <h1 className="flex flex-wrap text-xl font-bold text-gray-900 dark:text-white">
            {user && user?.name}
          </h1>
          <button aria-label="toggle-sidebar"
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <HiChevronLeft size={24} />
          </button>
        </div>
        <SidebarItems>
          <SidebarItemGroup>
            <SidebarItem
              className="cursor-pointer"
              onClick={() =>
                handleRedirect("/reps/dashboard", "/students/dashboard")
              }
              icon={HiHome}
            >
              Dashboard
            </SidebarItem>
            <SidebarItem
              className="cursor-pointer"
              onClick={() =>
                handleRedirect("/reps/assignments", "/students/assignments")
              }
              icon={MdAssignment}
            >
              Assignment
            </SidebarItem>
            <SidebarItem
              className="cursor-pointer"
              onClick={() =>
                handleRedirect("/reps/attendance", "/students/attendance")
              }
              icon={FaUserCheck}
            >
              Attendance
            </SidebarItem>
            {user?.isRep && (
              <SidebarItem
                className="cursor-pointer"
                onClick={() => handleRedirect("/reps/students", "")}
                icon={HiUser}
              >
                Students
              </SidebarItem>
            )}
          </SidebarItemGroup>
          <SidebarItemGroup>
            <SidebarItem
              className="cursor-pointer"
              onClick={() => handleRedirect("/reps/slides", "/students/slides")}
              icon={MdLibraryBooks}
            >
              Slides
            </SidebarItem>
            <SidebarItem
              className="cursor-pointer"
              onClick={() => handleRedirect("/reps/events", "/students/events")}
              icon={FiActivity}
            >
              Events
            </SidebarItem>
            <SidebarItem
              className="cursor-pointer"
              onClick={() => handleRedirect("/reps/groups", "/students/groups")}
              icon={MdGroups}
            >
              Groups
            </SidebarItem>
            {user?.isRep && (
              <SidebarItem
                className="cursor-pointer"
                onClick={() => handleRedirect("/reps/lecturers", "")}
                icon={HiMiniAcademicCap}
              >
                Lecturers
              </SidebarItem>
            )}
          </SidebarItemGroup>
          <SidebarItemGroup>
            <SidebarItem
              className="cursor-pointer"
              onClick={() =>
                handleRedirect("/reps/courses", "/students/courses")
              }
              icon={IoBookSharp}
            >
              Courses
            </SidebarItem>
            <SidebarItem
              className="cursor-pointer"
              onClick={() =>
                handleRedirect("/reps/feedbacks", "/students/feedbacks")
              }
              icon={VscFeedback}
            >
              Feedback
            </SidebarItem>
            {user?.isRep && (
              <SidebarItem
                className="cursor-pointer"
                onClick={() => handleRedirect("/reps/security", "")}
                icon={MdSecurity}
              >
                Security
              </SidebarItem>
            )}
            <SidebarItem
              className="cursor-pointer"
              onClick={logout}
              icon={RiLogoutCircleLine}
            >
              Logout
            </SidebarItem>
          </SidebarItemGroup>
        </SidebarItems>
      </FlowbiteSidebar>
    </div>
  );
};

export default Sidebar;
