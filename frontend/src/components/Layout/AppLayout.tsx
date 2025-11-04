import type { ReactNode } from "react";
import Sidebar from "../Sidebar";
import Topbar from "../Topbar";


const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-gray-50">
        <Topbar />
        <main className="p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};


export default AppLayout;
