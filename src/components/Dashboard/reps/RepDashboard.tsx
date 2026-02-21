import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Spinner,
  Badge,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "flowbite-react";
import {
  HiUserGroup,
  HiOutlineClipboardList,
  HiCalendar,
  HiSpeakerphone,
} from "react-icons/hi";
import {
  MdAssignment,
  MdBookmarkAdd,
  MdClass,
  MdQrCodeScanner,
} from "react-icons/md";
import StatCard from "../common/StatCard";
import { getStudents } from "../../../services/studentService";
import { getFeedbacks } from "../../../services/feedbackService";
import { getEvents } from "../../../services/eventService";
import { courses as getCourses } from "../../../services/courseService";
import { Feedback } from "../../../utils/Interfaces";
import useAuth from "../../../hooks/useAuth";
import { getSocketId } from "../../../context/socketContext";
import { IoBookSharp } from "react-icons/io5";
import { VscFeedback } from "react-icons/vsc";

const RepDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketConnection = getSocketId()

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFeedbacks: 0,
    activeCourses: 0,
    upcomingEvents: 0,
  });
  const [recentFeedbacks, setRecentFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [studentsRes, feedbackRes, eventsRes, coursesRes] =
          await Promise.allSettled([
            getStudents(1, 1),
            getFeedbacks(1, 5),
            getEvents(),
            getCourses(),
          ]);

        const studentCount =
          studentsRes.status === "fulfilled" &&
          studentsRes.value?.data?.pagination
            ? studentsRes.value.data.pagination.totalItems
            : 0;

        const feedbackData =
          feedbackRes.status === "fulfilled" ? feedbackRes.value?.data : null;
        const feedbackCount = feedbackData?.pagination?.totalItems || 0;
        setRecentFeedbacks(feedbackData?.feedbacks || []);

        const eventsData =
          eventsRes.status === "fulfilled" ? eventsRes.value?.data : [];
        const eventCount = Array.isArray(eventsData) ? eventsData.length : 0;

        const courseCount =
          coursesRes.status === "fulfilled" && coursesRes.value?.data
            ? coursesRes.value.data.length
            : 0;

        setStats({
          totalStudents: studentCount,
          totalFeedbacks: feedbackCount,
          activeCourses: courseCount,
          upcomingEvents: eventCount,
        });
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={HiUserGroup}
          color="blue"
          subText="Registered students"
          loading={loading}
          onClick={() => navigate("/reps/students")}
        />
        <StatCard
          title="Total Feedbacks"
          value={stats.totalFeedbacks}
          icon={VscFeedback}
          color="red"
          subText="Received to date"
          loading={loading}
          onClick={() => navigate("/reps/feedbacks")}
        />
        <StatCard
          title="Active Courses"
          value={stats.activeCourses}
          icon={IoBookSharp}
          color="purple"
          subText="Courses managed"
          loading={loading}
          onClick={() => navigate("/reps/courses")}
        />
        <StatCard
          title="Events"
          value={stats.upcomingEvents}
          icon={HiCalendar}
          color="green"
          subText="Total scheduled"
          loading={loading}
          onClick={() => navigate("/reps/events")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h5 className="text-xl leading-none font-bold text-gray-900 dark:text-white">
                Quick Actions
              </h5>
            </div>
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-3 lg:grid-cols-2">
              <Button onClick={() => navigate("/reps/events")}>
                <HiCalendar className="mr-2 h-5 w-5" />
                Create Event
              </Button>
              <Button onClick={() => navigate("/reps/slides")}>
                <MdClass className="mr-2 h-5 w-5" />
                Upload Slide
              </Button>
              <Button onClick={() => navigate("/reps/attendance")}>
                <MdBookmarkAdd className="mr-2 h-5 w-5" />
                Create Attendance
              </Button>
              <Button onClick={() => navigate("/reps/attendance/mark")}>
                <MdQrCodeScanner className="mr-2 h-5 w-5" />
                Mark Attendance
              </Button>
               <Button onClick={() => navigate("/reps/notifications")}>
                <HiSpeakerphone className="mr-2 h-5 w-5" />
                Announcement
              </Button>
            </div>
          </Card>

          <Card className="shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-xl leading-none font-bold text-gray-900 dark:text-white">
                Recent Feedback
              </h5>
              <span
                role="button"
                onClick={() => navigate("/reps/feedbacks")}
                className="cursor-pointer text-sm font-medium text-blue-600 hover:underline dark:text-blue-500"
              >
                View all
              </span>
            </div>
            <div className="overflow-x-auto">
              {loading && (
                <div className="flex justify-center p-4">
                  <Spinner />
                </div>
              )}

              {recentFeedbacks?.length > 0 ? (
                <Table hoverable striped>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell>From</TableHeadCell>
                      <TableHeadCell>Message</TableHeadCell>
                      <TableHeadCell>Type</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody className="divide-y">
                    {recentFeedbacks.map((fb) => (
                      <TableRow
                        key={fb.id}
                        className="bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        <TableCell className="font-medium whitespace-nowrap text-gray-900 dark:text-white">
                          {fb.is_anonymous
                            ? "Anonymous"
                            : fb.Student?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate line-clamp-2">
                          {fb.content}
                        </TableCell>
                        <TableCell>
                          <Badge color={fb.is_anonymous ? "warning" : "info"}>
                            {fb.is_anonymous ? "Anonymous" : "Public"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-4 text-center text-gray-500">
                  No recent feedback found.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-linear-to-br from-gray-50 to-white shadow-sm dark:from-gray-800 dark:to-gray-900">
            <h5 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
              System Status
            </h5>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className={`absolute inline-flex h-full w-full ${socketConnection ? "animate-ping rounded-full bg-green-400 opacity-75": ""}  `}></span>
                  <span className={`relative inline-flex h-3 w-3 rounded-full ${socketConnection ? "bg-green-500": "bg-red-500"}`}></span>
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Socket Connection
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Queue Worker: Idle
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-xs text-gray-500">
                Logged in as: {user?.data?.name || "User"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RepDashboard;
