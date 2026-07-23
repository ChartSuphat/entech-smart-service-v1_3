import { useState } from "react";
import type { ReactNode } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";

const AppLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Backdrop — mobile/tablet only, closes sidebar on tap */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="p-3 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
