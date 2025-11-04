import React, { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  HiDocumentText,
  HiWrenchScrewdriver,
  HiUser,
  HiCog6Tooth,
  HiUserGroup,
} from "react-icons/hi2";
import { BsFillDeviceSsdFill } from "react-icons/bs";
import { TbScubaDivingTankFilled } from "react-icons/tb";
import AppLayout from "../components/Layout/AppLayout";
import api from "../utils/axios";

// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4040';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

// Load current user
useEffect(() => {
  const loadUser = async () => {
    try {
      const response = await api.get('/auth/me');
      
      // ✅ Fix: Access response.data first, then check success
      console.log('User data:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);  // Get nested user data
      } else {
        setUser(response.data);  // Fallback if no success wrapper
      }
    } catch (error: any) {
      console.error('Auth check failed:', error.response?.data || error.message);
    }
  };
  loadUser();
}, []);

  const cards = [
    {
      icon: <HiDocumentText size={86} />,
      label: "Certificates",
      path: "/dashboard/certificates",
      roles: ['admin', 'technician', 'user'], // All users
    },
    {
      icon: <HiWrenchScrewdriver size={86} />,
      label: "Equipment",
      path: "/dashboard/equipment",
      roles: ['admin', 'technician', 'user'],
    },
    {
      icon: <TbScubaDivingTankFilled size={86} />,
      label: "Standard Gas",
      path: "/dashboard/tools",
      roles: ['admin', 'technician', 'user'],
    },
    {
      icon: <BsFillDeviceSsdFill  size={86} />,
      label: "Reference Devices",
      path: "/dashboard/devices",
      roles: ['admin', 'technician', 'user'],
    },
    {
      icon: <HiUser size={86} />,
      label: "Customers",
      path: "/dashboard/customers",
      roles: ['admin', 'technician', 'user'],
    },
    {
      icon: <HiUserGroup size={86} />,
      label: "User Management",
      path: "/dashboard/admin/users",
      roles: ['admin'], // Admin only
    },
    {
      icon: <HiCog6Tooth size={86} />,
      label: "Settings",
      path: "/dashboard/settings",
      roles: ['admin', 'technician', 'user'],
    },
    
  ];

  // Filter cards based on user role
  const visibleCards = cards.filter(card =>
    !card.roles || card.roles.includes(user?.role)
  );

  const isRootDashboard = location.pathname.toLowerCase() === "/dashboard";

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {isRootDashboard && (
          <>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 sm:mb-8">Dashboard</h1>

            {/* Mobile Layout - 2x3 Grid */}
            <div className="lg:hidden grid grid-cols-2 gap-4 max-w-sm mx-auto">
              {visibleCards.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(card.path)}
                  className="cursor-pointer flex flex-col items-center justify-center border-2 border-blue-300 p-6 rounded-lg bg-white transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-md aspect-square"
                >
                  <div className="text-blue-700 mb-3 transition-colors">
                    {React.cloneElement(card.icon, { size: 48 })}
                  </div>
                  <p className="text-blue-700 font-semibold text-sm text-center leading-tight">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {visibleCards.map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(card.path)}
                  className="group relative cursor-pointer flex flex-col items-center justify-center border border-blue-300 p-8 rounded-xl bg-white transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-2xl hover:z-10 overflow-hidden hover:border-sky-400 aspect-[4/5] h-[364px]"
                >
                  {/* Blue sky transparent overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-200/0 to-blue-400/0 group-hover:from-sky-200/50 group-hover:to-blue-400/40 transition-all duration-300 ease-in-out rounded-xl"></div>

                  {/* Card content */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-blue-700 group-hover:text-white mb-4 transition-all duration-300 group-hover:scale-105 drop-shadow-lg">
                      {React.cloneElement(card.icon, { size: 86 })}
                    </div>
                    <p className="text-blue-700 group-hover:text-white font-semibold text-xl transition-all duration-300 drop-shadow-sm text-center">
                      {card.label}
                    </p>
                  </div>

                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-sky-400/30"></div>
                </div>
              ))}
            </div>

            <footer className="text-center mt-8 sm:mt-12 lg:mt-18 text-gray-500 text-sm sm:text-base font-medium">
              © 2025 Entech Si Co., Ltd.
            </footer>
          </>
        )}

        <Outlet />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
