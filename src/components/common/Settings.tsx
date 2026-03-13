import ChangePassword from "../auth/ChangePassword";
import GoogleDriveAction from "../auth/GoogleDriveActions";
import useAuth from "../../hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-semibold tracking-normal dark:text-neutral-100">
        Settings
      </h2>

      <ChangePassword />
      
      {user?.isRep && <GoogleDriveAction />}
    </div>
  );
}
