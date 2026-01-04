import useAuth from "../../hooks/useAuth";
import RepDashboard from "../../components/Dashboard/reps/RepDashboard";
import StudentDashboard from "../../components/Dashboard/students/StudentDashboard";

const DashboardPage = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 transition-colors duration-200 md:p-6 dark:bg-gray-900">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {getGreeting()},{" "}
          <span className="text-blue-600 dark:text-blue-400">
            {user?.name?.split(" ")[0] || "User"}
          </span>
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's your daily overview and quick access to management tools.
        </p>
      </div>

      {user?.isRep ? <RepDashboard /> : <StudentDashboard />}
    </div>
  );
};

export default DashboardPage;
