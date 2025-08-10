import ForgotPassword from "../components/auth/ForgotPassword";

const ForgotPasswordPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="text-2xl">Forgot Password</h1>
      <ForgotPassword />
    </div>
  );
};
export default ForgotPasswordPage;
