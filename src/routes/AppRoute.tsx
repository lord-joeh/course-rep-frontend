import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/authContext";
import { ThemeProvider } from "../context/themeContext";
import AppLayout from "../components/Layout/AppLayout";
import LoginPage from "../pages/loginPage";
import RegisterPage from "../pages/registerPage";
import ForgotPasswordPage from "../pages/forgotPasswordPage";
import ResetPasswordPage from "../pages/resetPasswordPage";
import PrivateRoute from "./PrivateRoute";
import StudentsPage from "../pages/studentsPages/StudentsPage";
import RepRoute from "./RepRoute";
import StudentDetailsPage from "../pages/studentsPages/StudentDetailsPage";
import LecturersPage from "../pages/lecturersPage/lecturersPage";

const AppRoute = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset" element={<ResetPasswordPage />} />

            {/* Rep */}
            <Route element={<AppLayout />}>
              <Route path="reps/*" element={<RepRoute />}>
                <Route path="students" element={<StudentsPage />} />
                <Route path="students/:studentId" element={<StudentDetailsPage />} />
                <Route path="lecturers" element={<LecturersPage />} />
              </Route>

              {/* Students */}
              <Route path="students/*" element={<PrivateRoute />}>
                
              </Route>
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoute;
