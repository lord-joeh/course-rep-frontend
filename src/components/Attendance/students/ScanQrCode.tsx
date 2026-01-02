import { useEffect, useState, useCallback, useRef } from "react";
import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "../../../hooks/useAuth";
import { autoMarkAttendance } from "../../../services/attendanceService";
import { isAxiosError } from "axios";
import { ToastInterface } from "../../../utils/Interfaces";
import ToastMessage from "../../common/ToastMessage";

const ScanQrCode = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const autoMarkAttempted = useRef(false);

  const [toast, setToast] = useState<ToastInterface>({
    message: "",
    type: "error",
    isVisible: false,
  });

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: 0,
    longitude: 0,
  });

  const studentId = user?.data?.id;

  const closeToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  const getLocation = useCallback(() => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setToast({
        message: "Geolocation is not supported by this browser.",
        type: "error",
        isVisible: true,
      });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setToast({
          message:
            error?.message || "Error obtaining location. Please enable GPS.",
          type: "error",
          isVisible: true,
        });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000 },
    );
  }, []);

  const markAttendance = useCallback(
    async (targetToken: string) => {
      if (isProcessing || !targetToken) return;

      if (location.latitude === 0 && location.longitude === 0) {
        setToast({
          message: "Waiting for location...",
          type: "error",
          isVisible: true,
        });
        return;
      }

      if (!studentId) {
        setToast({
          message: "You must login before marking attendance.",
          type: "error",
          isVisible: true,
        });
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      try {
        setIsProcessing(true);
        const response = await autoMarkAttendance(
          studentId,
          targetToken,
          location,
        );

        setToast({
          message: response?.message || "Attendance marked successfully",
          type: "success",
          isVisible: true,
        });
      } catch (error) {
        const errorMsg = isAxiosError(error)
          ? error.response?.data?.error || "Server Error"
          : "Failed to mark attendance";

        setToast({
          message: errorMsg,
          type: "error",
          isVisible: true,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [studentId, isProcessing, location, navigate],
  );

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (isProcessing || isLocating) return;

    const rawValue = detectedCodes[0]?.rawValue;
    if (!rawValue) return;

    try {
      let tokenToUse = rawValue;
      if (rawValue.includes("?")) {
        const url = new URL(rawValue);
        tokenToUse = url.searchParams.get("token") ?? rawValue;
      }

      await markAttendance(tokenToUse);
    } catch (error) {
      console.error("Scan error:", error);
    }
  };

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    const hasLocation = location.latitude !== 0;
    const hasToken = !!params.token;

    if (hasToken && hasLocation && !autoMarkAttempted.current) {
      autoMarkAttempted.current = true;
      markAttendance(params.token!);
    }
  }, [location, params.token, markAttendance]);

  return (
    <div className="container flex h-screen w-full flex-col items-center justify-center gap-5 p-4 md:max-w-lg">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
        <Scanner
          onScan={handleScan}
          onError={(error) => console.log(error)}
          paused={isProcessing || isLocating}
          constraints={{
            facingMode: "environment",
            aspectRatio: 1,
          }}
          components={{
            onOff: true,
            torch: true,
          }}
        />

        {(isProcessing || isLocating) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 text-white">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
            <p className="animate-pulse font-medium">
              {isLocating ? "Acquiring GPS..." : "Verifying Attendance..."}
            </p>
          </div>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold dark:text-white">
          Scan Attendance QR
        </h2>
        <p className="text-sm text-gray-500">
          {isLocating
            ? "Waiting for GPS signal..."
            : "Align the QR code within the frame"}
        </p>
      </div>

      {toast.isVisible && (
        <ToastMessage
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default ScanQrCode;
