import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/authContext";
import { ThemeProvider } from "../context/themeContext";
import AppLayout from "../components/Layout/AppLayout";
import LoginPage from "../pages/Auth Pages/LoginPage";
import RegisterPage from "../pages/Auth Pages/RegisterPage";
import ForgotPasswordPage from "../pages/Auth Pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/Auth Pages/ResetPasswordPage";
import PrivateRoute from "./PrivateRoute";
import StudentsPage from "../pages/students Pages/StudentsPage";
import RepRoute from "./RepRoute";
import StudentDetailsPage from "../pages/students Pages/StudentDetailsPage";
import LecturerPage from "../pages/lecturers Page/LecturerPage";
import RepEventPage from "../pages/Events Page/RepEventPage";
import CourseRepPage from "../pages/Course Pages/CourseRepPage";
import CourseStudentPage from "../pages/Course Pages/CourseStudentPage";
import RepFeedbackPage from "../pages/Feedback Page/RepFeedbackPage";

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
                <Route path="lecturers" element={<LecturerPage />} />
                <Route path="events" element={<RepEventPage />} />
                <Route path="courses" element={<CourseRepPage/>} />
                <Route path="feedbacks" element={<RepFeedbackPage/>} />
              </Route>

              {/* Students */}
              <Route path="students/*" element={<PrivateRoute />}>
              <Route path="events" element={<RepEventPage />} />
              <Route path="courses" element={<CourseStudentPage />} />
              </Route>
            </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoute;
