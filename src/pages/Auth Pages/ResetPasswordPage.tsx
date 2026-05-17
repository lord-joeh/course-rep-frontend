import ResetPassword from "../../components/auth/ResetPassword";

const ResetPasswordPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="text-2xl">Reset Password</h1>
      <ResetPassword />
    </div>
  );
};

export default ResetPasswordPage;
