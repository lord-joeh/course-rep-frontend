import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Timeline,
  Button,
  Progress,
  Spinner,
  TimelineItem,
  TimelinePoint,
  TimelineContent,
  TimelineTime,
  TimelineTitle,
  TimelineBody,
} from "flowbite-react";
import { HiCalendar, HiArrowNarrowRight, HiClock } from "react-icons/hi";
import { MdAssignment, MdCheckCircle } from "react-icons/md";
import StatCard from "../common/StatCard";
import { getAssignmentsByCourse } from "../../../services/assignmentService";
import { getEvents } from "../../../services/eventService";
import { courses as getCourses } from "../../../services/courseService";
import { Event, Course, AssignmentsInterface } from "../../../utils/Interfaces";
import { format } from "date-fns";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    activeAssignments: 0,
    nextClass: "None",
    eventsCount: 0,
  });
  const [deadlines, setDeadlines] = useState<AssignmentsInterface[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        const coursesRes = await getCourses();
        const coursesList = coursesRes?.data || [];
        setCourses(coursesList);

        const eventsRes = await getEvents();
        const eventsList = (eventsRes?.data as Event[]) || [];

        let allAssignments: AssignmentsInterface[] = [];

        if (coursesList.length > 0) {
          const assignmentsPromises = coursesList
            .slice(0, 3)
            .map((c: Course) => getAssignmentsByCourse(c.id, 5, 1));
          const assignmentsResults =
            await Promise.allSettled(assignmentsPromises);

          assignmentsResults.forEach((res) => {
            if (res.status === "fulfilled" && res.value?.data?.assignments) {
              allAssignments = [
                ...allAssignments,
                ...res.value.data.assignments,
              ];
            }
          });
        }

        const futureAssignments = allAssignments
          .filter((a) => new Date(a.deadline) > new Date())
          .sort(
            (a, b) =>
              new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
          );

        const nextEvent = eventsList.find(
          (e) => new Date(e.date) >= new Date(),
        );

        setDeadlines(futureAssignments.slice(0, 3));
        setStats({
          activeAssignments: futureAssignments.length,
          nextClass: nextEvent
            ? format(new Date(nextEvent.date), "MMM dd")
            : "No Events",
          eventsCount: eventsList.length,
        });
      } catch (error) {
        console.error("Error fetching student dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  return (
    <div className="fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Events"
          value={stats.eventsCount}
          icon={MdCheckCircle}
          color="green"
          subText="Upcoming activities"
          loading={loading}
          onClick={() => navigate("/students/events")}
        />
        <StatCard
          title="Assignments Due"
          value={stats.activeAssignments}
          icon={MdAssignment}
          color="red"
          subText="Pending submission"
          loading={loading}
          onClick={() => navigate("/students/assignments")}
        />
        <StatCard
          title="Next Event"
          value={stats.nextClass}
          icon={HiCalendar}
          color="blue"
          subText="Check schedule"
          loading={loading}
          onClick={() => navigate("/students/events")}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-sm">
            <h5 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              Upcoming Deadlines
            </h5>
            {loading ? (
              <div className="flex justify-center p-6">
                <Spinner />
              </div>
            ) : deadlines.length > 0 ? (
              <Timeline>
                {deadlines.map((assignment) => (
                  <TimelineItem key={assignment.id}>
                    <TimelinePoint icon={MdAssignment} />
                    <TimelineContent>
                      <TimelineTime>
                        {format(
                          new Date(assignment.deadline),
                          "MMMM do, yyyy - h:mm a",
                        )}
                      </TimelineTime>
                      <TimelineTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {assignment.title}
                      </TimelineTitle>
                      <TimelineBody className="max-w-md text-gray-500">
                        {assignment.description.substring(0, 100)}...
                      </TimelineBody>
                      <Button
                        color="gray"
                        size="xs"
                        onClick={() => navigate(`/students/assignments`)}
                      >
                        View Details{" "}
                        <HiArrowNarrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <div className="py-6 text-center text-gray-500">
                <HiClock className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                <p>No pending assignments!</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <h5 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Your Courses
            </h5>
            {courses.length > 0 ? (
              <div className="space-y-4">
                {courses.slice(0, 4).map((course) => (
                  <div key={course.id}>
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {course.name}
                      </span>
                    </div>
                    <Progress
                      progress={Math.floor(Math.random() * 40) + 20}
                      color="blue"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No courses enrolled.</p>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                size="xs"
                color="light"
                onClick={() => navigate("/students/courses")}
              >
                View All
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
