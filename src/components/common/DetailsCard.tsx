import { Card } from "flowbite-react";

interface ICard {
  color: string;
  title: string;
  value: any;
}

export default function DetailsCard({ color, title, value }: ICard) {
  return (
    <>
      <Card className={`bg-${color}-50 dark:bg-blue-900/20`}>
        <div className="flex flex-col items-center">
          <span className={`text-sm font-medium text-${color}-600`}>
            {title}
          </span>
          <span className={`text-2xl font-bold text-${color}-600`}>
            {value}
          </span>
        </div>
      </Card>
    </>
  );
}
