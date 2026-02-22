import  { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";


const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900"
    >
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={`bg-opacity-50 fixed inset-0 z-40 bg-black transition-opacity md:hidden ${
            isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={toggleSidebar}
        />
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet  />
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
