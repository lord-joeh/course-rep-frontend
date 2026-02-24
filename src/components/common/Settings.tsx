import ChangePassword from "../auth/ChangePassword";

export default function Settings() {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-semibold tracking-normal dark:text-neutral-100">
        Settings
      </h2>

      <ChangePassword />
    </div>
  );
}
