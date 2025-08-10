import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/authContext";
import { ThemeProvider } from "../context/themeContext";
import AppLayout from "../components/Layout/AppLayout";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ForgotPasswordPage from "../pages/forgotPasswordPage";
import ResetPasswordPage from "../pages/resetPasswordPage";

const AppRoute = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
      </Routes>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
          </Routes>
          <AppLayout>
            <Routes></Routes>
          </AppLayout>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoute;
