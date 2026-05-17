import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../context/authContext";
import { ThemeProvider } from "../context/themeContext";
import { SocketProvider } from "../context/socketContext";
import { ProgressProvider } from "../context/ProgressContext";
import PrivateRoute from "./PrivateRoute";
import RepRoute from "./RepRoute";

const GlobalProgressTracker = lazy(
  () => import("../components/common/GlobalProgressTracker"),
);
const AppLayout = lazy(() => import("../components/Layout/AppLayout"));
const LoginPage = lazy(() => import("../pages/Auth Pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/Auth Pages/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("../pages/Auth Pages/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(
  () => import("../pages/Auth Pages/ResetPasswordPage"),
);

const StudentsPage = lazy(() => import("../pages/students Pages/StudentsPage"));
const StudentDetailsPage = lazy(
  () => import("../pages/students Pages/StudentDetailsPage"),
);
const LecturerPage = lazy(() => import("../pages/lecturers Page/LecturerPage"));
const RepEventPage = lazy(() => import("../pages/Events Page/RepEventPage"));
const CourseRepPage = lazy(() => import("../pages/Course Pages/CourseRepPage"));
const CourseStudentPage = lazy(
  () => import("../pages/Course Pages/CourseStudentPage"),
);
const RepFeedbackPage = lazy(
  () => import("../pages/Feedback Page/RepFeedbackPage"),
);
const StudentFeedbackPage = lazy(
  () => import("../pages/Feedback Page/StudentFeedbackPage"),
);
const RepGroupPage = lazy(() => import("../pages/Groups Page/RepGroupPage"));
const GroupMembersPage = lazy(
  () => import("../pages/Groups Page/GroupMembersPage"),
);
const EventListener = lazy(() => import("../components/common/EventListener"));
const Groups = lazy(
  () => import("../components/Groups Management/students/Group.tsx"),
);
const SlidePage = lazy(() => import("../pages/Slides Page/SlidePage.tsx"));
const AssignmentPage = lazy(
  () => import("../pages/Assignment Page/AssignmentPage.tsx"),
);
const StudentSubmittedAssignmentPage = lazy(
  () => import("../pages/Assignment Page/StudentSubmittedAssignmentPage.tsx"),
);
const AssignmentDetailsPage = lazy(
  () => import("../pages/Assignment Page/AssignmentDetailsPage.tsx"),
);
const AttendanceInstancePage = lazy(
  () => import("../pages/Attendance Page/AttendanceInstancePage.tsx"),
);
const AttendancePage = lazy(
  () => import("../pages/Attendance Page/AttendancePage.tsx"),
);
const ScanQrCodePage = lazy(
  () => import("../pages/Attendance Page/ScanQrCodePage.tsx"),
);
const GlobalErrorHandler = lazy(
  () => import("../components/common/GlobalErrorHandler.tsx"),
);
const DashboardPage = lazy(
  () => import("../pages/Dashboard Page/DashboardPage.tsx"),
);
const RepNotificationPage = lazy(
  () => import("../pages/Notification page/RepNotificationPage.tsx"),
);
const SettingsPage = lazy(() => import("../pages/Auth Pages/SettingsPage.tsx"));
import PushNotificationManager from "../components/Notification Management/PushNotificationManager.tsx";

function PageLoader() {
  return <p>Loading page...</p>;
}
const AppRoute = () => {
  return (
    <BrowserRouter>
      <SocketProvider>
        <ProgressProvider>
          <AuthProvider>
            <ThemeProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route path="/reset" element={<ResetPasswordPage />} />

                  {/* Rep */}
                  <Route element={<AppLayout />}>
                    <Route path="reps/*" element={<RepRoute />}>
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route
                        path="notifications"
                        element={<RepNotificationPage />}
                      />
                      <Route path="students" element={<StudentsPage />} />
                      <Route
                        path="students/:studentId"
                        element={<StudentDetailsPage />}
                      />
                      <Route path="lecturers" element={<LecturerPage />} />
                      <Route path="events" element={<RepEventPage />} />
                      <Route path="courses" element={<CourseRepPage />} />
                      <Route path="feedbacks" element={<RepFeedbackPage />} />
                      <Route path="groups" element={<RepGroupPage />} />
                      <Route
                        path="groups/:groupId"
                        element={<GroupMembersPage />}
                      />
                      <Route path="slides" element={<SlidePage />} />
                      <Route path="assignments" element={<AssignmentPage />} />
                      <Route
                        path="assignments/submissions"
                        element={<StudentSubmittedAssignmentPage />}
                      />
                      <Route
                        path="assignments/:assignmentId/submissions/details"
                        element={<AssignmentDetailsPage />}
                      />
                      <Route
                        path="attendance"
                        element={<AttendanceInstancePage />}
                      />
                      <Route
                        path="attendance/:instanceId"
                        element={<AttendancePage />}
                      />
                      <Route
                        path="attendance/mark"
                        element={<ScanQrCodePage />}
                      />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>

                    <Route path="mark" element={<ScanQrCodePage />} />
                    <Route path="push" element={<PushNotificationManager />} />

                    {/* Students */}
                    <Route path="students/*" element={<PrivateRoute />}>
                      <Route path="dashboard" element={<DashboardPage />} />
                      <Route path="events" element={<RepEventPage />} />
                      <Route path="courses" element={<CourseStudentPage />} />
                      <Route
                        path="feedbacks"
                        element={<StudentFeedbackPage />}
                      />
                      <Route path="groups" element={<Groups />} />
                      <Route
                        path="groups/:groupId"
                        element={<GroupMembersPage />}
                      />
                      <Route path="assignments" element={<AssignmentPage />} />
                      <Route path="slides" element={<SlidePage />} />
                      <Route
                        path="assignments/submissions"
                        element={<StudentSubmittedAssignmentPage />}
                      />
                      <Route path="attendance" element={<ScanQrCodePage />} />
                      <Route path="settings" element={<SettingsPage />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
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
