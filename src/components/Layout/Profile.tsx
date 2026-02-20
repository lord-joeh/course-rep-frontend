import { Avatar, Button, Dropdown } from "flowbite-react";
import useAuth from "../../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

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

        <div className="mt-2">
          <Button color="alternative" className="w-full border-none">
            Change Password
          </Button>
        </div>
      </div>
    </Dropdown>
  );
}
