import { useState } from "react";
import { HiBell } from "react-icons/hi";
import { FiMenu } from "react-icons/fi";
import { Avatar, Badge } from "flowbite-react";
import { navbarProp } from "../../utils/Interfaces";

const Navbar = ({
  toggleSidebar,
  brandName = "Rep Management",
}: navbarProp) => {
  const [notificationCount, setNotificationCount] = useState(5);

  const handleNotificationClick = () => {
    console.log(`You have ${notificationCount} new notifications!`);
    setNotificationCount(0);
  };

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
        <div
          className="relative cursor-pointer"
          onClick={handleNotificationClick}
        >
          <HiBell size={32} className="text-gray-500 dark:text-gray-400" />
          {notificationCount > 0 && (
            <Badge
              color="failure"
              className="absolute -top-1 -right-1 rounded-full"
            >
              {notificationCount}
            </Badge>
          )}
        </div>
        <Avatar rounded />
      </div>
    </nav>
  );
};

export default Navbar;
