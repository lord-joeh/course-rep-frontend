import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/authContext";
import { ThemeProvider } from "../context/themeContext";
import { SocketProvider } from "../context/socketContext";
import { ProgressProvider } from "../context/ProgressContext";
import GlobalProgressTracker from "../components/common/GlobalProgressTracker";
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
import StudentFeedbackPage from "../pages/Feedback Page/StudentFeedbackPage";
import RepGroupPage from "../pages/Groups Page/RepGroupPage";
import GroupMembersPage from "../pages/Groups Page/GroupMembersPage";
import EventListener from "../components/common/EventListener";
import Groups from "../components/Groups Management/students/Group.tsx";
import SlidePage from "../pages/Slides Page/SlidePage.tsx";
import AssignmentPage from "../pages/Assignment Page/AssignmentPage.tsx";
import StudentSubmittedAssignmentPage from "../pages/Assignment Page/StudentSubmittedAssignmentPage.tsx";
import AssignmentDetailsPage from "../pages/Assignment Page/AssignmentDetailsPage.tsx";
import AttendanceInstancePage from "../pages/Attendance Page/AttendanceInstancePage.tsx";
import AttendancePage from "../pages/Attendance Page/AttendancePage.tsx";
import ScanQrCodePage from "../pages/Attendance Page/ScanQrCodePage.tsx";
import GlobalErrorHandler from "../components/common/GlobalErrorHandler.tsx";
import DashboardPage from "../pages/Dashboard Page/DashboardPage.tsx";

const AppRoute = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        <ProgressProvider>
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
                  <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="students/:studentId" element={<StudentDetailsPage />} />
                    <Route path="lecturers" element={<LecturerPage />} />
                    <Route path="events" element={<RepEventPage />} />
                    <Route path="courses" element={<CourseRepPage />} />
                    <Route path="feedbacks" element={<RepFeedbackPage />} />
                    <Route path="groups" element={<RepGroupPage />} />
                    <Route path="groups/:groupId" element={<GroupMembersPage />} />
                    <Route path="slides" element={<SlidePage />} />
                    <Route path="assignments" element={<AssignmentPage />} />
                    <Route path="assignments/submissions" element={<StudentSubmittedAssignmentPage />} />
                    <Route path="assignments/:assignmentId/submissions/details" element={<AssignmentDetailsPage />} />
                    <Route path="attendance" element={<AttendanceInstancePage />} />
                    <Route path="attendance/:instanceId" element={<AttendancePage />} />
                    <Route path="attendance/mark" element={<ScanQrCodePage />} />
                  </Route>

                  <Route path="mark" element={<ScanQrCodePage/>} />

                  {/* Students */}
                  <Route path="students/*" element={<PrivateRoute />}>
                  <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="events" element={<RepEventPage />} />
                    <Route path="courses" element={<CourseStudentPage />} />
                    <Route path="feedbacks" element={<StudentFeedbackPage />} />
                    <Route path="groups" element={<Groups />} />
                    <Route path="groups/:groupId" element={<GroupMembersPage />} />
                    <Route path="assignments" element={<AssignmentPage />} />
                    <Route path="slides" element={<SlidePage />} />
                    <Route path="assignments/submissions" element={<StudentSubmittedAssignmentPage />} />
                    <Route path="attendance" element={<ScanQrCodePage />} />
                  </Route>
                </Route>
              </Routes>
              <EventListener />
              <GlobalErrorHandler />
              <GlobalProgressTracker />
            </ThemeProvider>
          </AuthProvider>
        </ProgressProvider>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default AppRoute;
