import Notifications from "./Notification";
import { FiMenu } from "react-icons/fi";
import { navbarProp } from "../../utils/Interfaces";
import Profile from "./Profile";

const Navbar = ({
  toggleSidebar,
  brandName = "Rep Management",
}: navbarProp) => {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-[#adb5bd] p-4 shadow-sm dark:bg-gray-700">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 focus:ring-2 focus:ring-gray-200 focus:outline-none md:hidden dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <FiMenu size={24} />
        </button>
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {brandName}
        </span>
      </div>

      <div className="flex items-center space-x-8">
        <Notifications />
        <Profile />
      </div>
    </nav>
  );
};

export default Navbar;
