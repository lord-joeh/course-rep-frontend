import Register from "../../components/auth/Register";

const RegisterPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-4">
      <h1 className="text-2xl">Create an Account</h1>
      <Register />
    </div>
  );
};

export default RegisterPage;
