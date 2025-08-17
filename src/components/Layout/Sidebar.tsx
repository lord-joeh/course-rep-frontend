import {
  Sidebar as FlowbiteSidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from "flowbite-react";
import {
  HiHome,
  HiUser,
  HiChevronLeft,
} from "react-icons/hi";
import { MdLibraryBooks, MdGroups,MdSecurity, MdAssignment } from "react-icons/md";
import { VscFeedback } from "react-icons/vsc";
import { RiLogoutCircleLine } from "react-icons/ri";
import { HiMiniAcademicCap } from "react-icons/hi2";
import { FaUserCheck } from "react-icons/fa";
import { FiActivity } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

type SidebarProps = {
  isSidebarOpen: boolean,
  toggleSidebar: ()=> void
};


const Sidebar = ({ isSidebarOpen, toggleSidebar }: SidebarProps) => {
  const { user, logout }= useAuth()
  const navigate = useNavigate()
  
  const handleRedirect = (repPath: string, studentPath: string) =>{
    navigate(user?.isRep? repPath : studentPath)
  }

 return (
    <div
      className={`fixed inset-y-0 left-0 z-50 transform md:transform-none transition-transform duration-300 ease-in-out dark:bg-gray-900 bg-gray-700 shadow-lg ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:static`}
    >
      <FlowbiteSidebar className="h-full overflow-y-auto custom-scrollbar-hide ">
        <div className="flex items-center justify-between p-4 border-b-1 border-gray-700  dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex flex-wrap">{user && user?.name}</h1>
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <HiChevronLeft size={24} />
          </button>
        </div>
        <SidebarItems >
          <SidebarItemGroup>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/dashboard', '/students/dashboard')} icon={HiHome}>Dashboard</SidebarItem>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/assignment', '/students/assignment')} icon={MdAssignment}>Assignment</SidebarItem>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/attendance', '/students/attendance')} icon={FaUserCheck}>Attendance</SidebarItem>
           {user?.isRep && <SidebarItem href= '' onClick={()=> handleRedirect('/reps/students', '')} icon={HiUser}>Students</SidebarItem>} 
            </SidebarItemGroup>
          <SidebarItemGroup>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/slides', '/students/slides')} icon={MdLibraryBooks}>Slides</SidebarItem>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/events', '/students/events')} icon={FiActivity}>Events</SidebarItem>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/groups', '/students/groups')} icon={MdGroups}>Groups</SidebarItem>
            {user?.isRep && <SidebarItem href='/reps/lecturers' icon={HiMiniAcademicCap}>Lecturers</SidebarItem>}
            </SidebarItemGroup>
          <SidebarItemGroup>
            <SidebarItem href="" onClick={()=> handleRedirect('/reps/feedback', '/students/feedback')} icon={VscFeedback}>Feedback</SidebarItem>
           {user?.isRep && <SidebarItem href= '/reps/dashboard'  icon={MdSecurity}>Security</SidebarItem>} 
            <SidebarItem href="" onClick={logout} icon={RiLogoutCircleLine}>Logout</SidebarItem>
            </SidebarItemGroup>
        </SidebarItems>
      </FlowbiteSidebar>
    </div>
  );
};

export default Sidebar;
