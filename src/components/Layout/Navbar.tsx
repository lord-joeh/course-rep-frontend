import { useState } from "react";
import { HiBell } from "react-icons/hi";
import { FiMenu } from "react-icons/fi";
import { Avatar, Badge } from "flowbite-react";
import { RxAvatar } from "react-icons/rx";

type navbarProp = {
  toggleSidebar: () => void;
  brandName?: string;
};

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
    <nav className="sticky top-0 z-50 flex justify-between items-center bg-[#adb5bd] dark:bg-gray-700 p-4 shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <FiMenu size={24} />
        </button>
        <span className="text-xl font-bold text-gray-900 dark:text-white">{brandName}</span>
      </div>

      <div className="flex items-center space-x-8">
        <div className="relative cursor-pointer" onClick={handleNotificationClick}>
          <HiBell size={32} className="text-gray-500 dark:text-gray-400" />
          {notificationCount > 0 && (
            <Badge color="failure" className="absolute -top-1 -right-1 rounded-full">
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
