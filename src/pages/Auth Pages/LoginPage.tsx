import Login from "../../components/auth/Login";
const LoginPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="text-2xl">Login to Your Account</h1>
      <Login />
    </div>
  );
};

export default LoginPage;
