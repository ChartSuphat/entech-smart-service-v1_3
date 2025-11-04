import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiDocumentText,
  HiWrenchScrewdriver,
  HiUser,
  HiCog6Tooth,
  HiUserGroup
} from "react-icons/hi2";
import { BsFillDeviceSsdFill } from "react-icons/bs";
import { TbScubaDivingTankFilled } from "react-icons/tb";
import { FaTachometerAlt } from 'react-icons/fa';
import api from '../utils/axios';

// ✅ Use env variable with safe fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4040';

const Sidebar = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as 'light' | 'dark');
  }, []);

// Load user role
useEffect(() => {
  const loadUser = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/me');
      
      // ✅ Axios response structure: response.data contains your API response
      console.log('✅ User data:', response.data);
      
      if (response.data.success) {
        setUser(response.data.data);  // Access nested data
      } else {
        console.warn('User fetch failed');
        setUser({ role: 'guest' });
      }
    } catch (err) {
      console.error("❌ User fetch error:", err);
      setUser({ role: 'guest' });
    } finally {
      setIsLoading(false);
    }
  };
  loadUser();
}, []);

  // Define menu items
  const menuItems = [
    { label: 'Dashboard', icon: <FaTachometerAlt />, path: '/dashboard', exact: true, roles: ['admin', 'technician', 'user'] },
    { label: 'Certificates', icon: <HiDocumentText />, path: '/dashboard/certificates', roles: ['admin', 'technician', 'user'] },
    { label: 'Equipment', icon: <HiWrenchScrewdriver />, path: '/dashboard/equipment', roles: ['admin', 'technician', 'user'] },
    { label: 'Standard Gas', icon: <TbScubaDivingTankFilled />, path: '/dashboard/tools', roles: ['admin', 'technician', 'user'] },
     { label: 'Reference Devices', icon: <BsFillDeviceSsdFill />, path: '/dashboard/devices', roles: ['admin', 'technician', 'user'] },
    { label: 'Customers', icon: <HiUser />, path: '/dashboard/customers', roles: ['admin', 'technician', 'user'] },
    { label: 'User Management', icon: <HiUserGroup />, path: '/dashboard/admin/users', roles: ['admin'] },
    { label: 'Settings', icon: <HiCog6Tooth />, path: '/dashboard/settings', roles: ['admin', 'technician', 'user'] },
  ];

  // Filter by role
  const visibleMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  // 🔹 Loading skeleton UI
  if (isLoading) {
    return (
      <aside className={`flex w-64 h-screen shadow-md flex-col border-r ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        }`}>
        <div className="h-20 border-b flex items-center justify-center p-4">
          <div className="w-3/4 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-10 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          ))}
        </nav>
      </aside>
    );
  }

  // 🔹 Actual Sidebar
  return (
    <aside
      className={`flex w-64 h-screen shadow-md flex-col border-r transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
        }`}
    >
      {/* Logo */}
      <div className={`h-20 flex items-center justify-center border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
        }`}>
        <NavLink to="/dashboard" className="flex items-center justify-center">
          <img src="/Logo.png" alt="ENTECH SI Logo" className="h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity" />
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.label === 'Dashboard'}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200
                   ${isActive
                    ? theme === 'dark'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-100 text-blue-700'
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-blue-800 hover:text-white'
                      : 'text-gray-700 hover:bg-blue-200 hover:text-blue-700'
                  }`
                }
              >
                <span className="text-lg transition-transform duration-200 ease-out group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="transition-transform duration-200 ease-out group-hover:scale-105">
                  {item.label}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
