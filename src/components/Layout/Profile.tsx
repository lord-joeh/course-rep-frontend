import { Avatar, Dropdown } from "flowbite-react";
import useAuth from "../../hooks/useAuth";
import { PiGearFineBold } from "react-icons/pi";
import { MdOutlineToggleOff } from "react-icons/md";
import { CiLogout } from "react-icons/ci";
import useTheme from "../../hooks/useTheme";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  let userInitials = "";

  user?.data?.name.split(" ").map((name) => {
    userInitials += name.charAt(0).toUpperCase();
  });

  return (
    <Dropdown
      arrowIcon={false}
      inline
      label={
        <div className="relative cursor-pointer transition-colors">
          <Avatar bordered rounded placeholderInitials={userInitials} />
        </div>
      }
    >
      <div className="w-80 sm:w-96">
        <div className="flex flex-col items-center justify-center gap-2">
          <Avatar rounded placeholderInitials={userInitials} size="lg" />
          <span className="text-lg font-medium text-gray-700">
            {user?.data.name}
          </span>
          <span className="text-md font-medium text-gray-700">
            {user?.data.id}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {user?.data.email}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {user?.data.phone}
          </span>
        </div>

        <div className="mt-2 flex flex-col">
          <span
            className="mb-0.5 flex h-12 w-full cursor-pointer items-center justify-start gap-2 p-2 hover:bg-neutral-100"
            role="button"
          >
            <PiGearFineBold size={24} color="gray" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-100">
              Settings
            </p>
          </span>

          <span
            className="mb-0.5 flex h-12 w-full cursor-pointer items-center justify-start gap-2 p-2 hover:bg-neutral-100"
            role="button"
            onClick={toggleTheme}
          >
            <MdOutlineToggleOff size={32} color="gray" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-100">
              {theme?.name} mode
            </p>
          </span>

          <span
            className="mb-0.5 flex h-12 w-full cursor-pointer items-center justify-start gap-2 p-2 hover:bg-neutral-100"
            role="button"
            onClick={logout}
          >
            <CiLogout size={24} color="red" />
            <p className="text-xl font-medium text-red-500">Logout</p>
          </span>
        </div>
      </div>
    </Dropdown>
  );
}
