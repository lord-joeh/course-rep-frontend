import { Card, Spinner } from "flowbite-react";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string | number | null;
  icon: IconType;
  color: "blue" | "green" | "purple" | "red" | "yellow";
  subText?: string;
  onClick?: () => void;
  loading?: boolean;
}

const colorClasses = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  green: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
  purple:
    "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
  red: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
  yellow:
    "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300",
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  subText,
  onClick,
  loading,
}: StatCardProps) => {
  return (
    <Card
      className={`flex-1 transition-all duration-200 ${onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="w-full">
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-baseline">
            {loading ? (
              <Spinner size="sm" aria-label="Loading stats" />
            ) : (
              <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {value ?? 0}
              </h5>
            )}
          </div>
          {subText && (
            <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
              {subText}
            </p>
          )}
        </div>
        <div className={`shrink-0 rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
