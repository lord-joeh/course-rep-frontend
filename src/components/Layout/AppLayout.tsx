import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import useAuth from "../../hooks/useAuth";
type appLayout = {
  children: React.ReactNode;
};

const AppLayout = ({ children }: appLayout) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

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

  useEffect(() => {
    const showContent = () => {
      const mainContent = document.querySelector("#app-content");
      if (!user) {
        mainContent?.classList.add("hide-main-content");
      } else {
        mainContent?.classList.remove("hide-main-content");
      }
    };
    showContent();
  }, [user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      id="app-content"
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default AppLayout;
