import { Button, Card } from "flowbite-react";
import { BsDownload } from "react-icons/bs";

interface ViewQRCodeProps {
  imageUrl: string;
  course_Id?: string;
  date?: string;
  getCourseName: (courseId: string) => string;
}

const ViewQRCode = ({
  imageUrl,
  course_Id,
  date,
  getCourseName,
}: ViewQRCodeProps) => {
  const handleDownloadQRCode = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${getCourseName(course_Id ?? "")} ${new Date(date ?? "").toDateString()} Attendance qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col justify-center dark:text-white">
      <Card imgSrc={imageUrl} imgAlt="QR Code">
        <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {getCourseName(course_Id || "")}
        </h5>
        <p className="text-lg font-semibold">ATTENDANCE</p>
        <p className="font-normal text-gray-700 dark:text-gray-400">
          Scan this QR code to mark your attendance for the Class.
        </p>
        <p className="font-normal">{new Date(date ?? "").toDateString()}</p>
      </Card>

      <div className="mt-4 flex justify-center">
        <Button
          className="w-full cursor-pointer text-xl"
          onClick={handleDownloadQRCode}
        >
          <BsDownload size={24} className="me-2" />
          Download
        </Button>
      </div>
    </div>
  );
};

export default ViewQRCode;
