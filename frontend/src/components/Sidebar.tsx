import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  HiDocumentText,
  HiWrenchScrewdriver,
  HiUser,
  HiCog6Tooth,
  HiUserGroup,
  HiXMark,
} from "react-icons/hi2";
import { BsFillDeviceSsdFill } from "react-icons/bs";
import { TbScubaDivingTankFilled } from "react-icons/tb";
import { FaTachometerAlt } from 'react-icons/fa';
import api from '../utils/axios';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme as 'light' | 'dark');
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          setUser({ role: 'guest' });
        }
      } catch (err) {
        setUser({ role: 'guest' });
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const menuItems = [
    { label: 'Dashboard',         icon: <FaTachometerAlt />,         path: '/dashboard',              roles: ['admin', 'technician', 'user'] },
    { label: 'Certificates',      icon: <HiDocumentText />,          path: '/dashboard/certificates', roles: ['admin', 'technician', 'user'] },
    { label: 'Equipment',         icon: <HiWrenchScrewdriver />,     path: '/dashboard/equipment',    roles: ['admin', 'technician', 'user'] },
    { label: 'Standard Gas',      icon: <TbScubaDivingTankFilled />, path: '/dashboard/tools',        roles: ['admin', 'technician', 'user'] },
    { label: 'Reference Devices', icon: <BsFillDeviceSsdFill />,     path: '/dashboard/devices',      roles: ['admin', 'technician', 'user'] },
    { label: 'Customers',         icon: <HiUser />,                  path: '/dashboard/customers',    roles: ['admin', 'technician', 'user'] },
    { label: 'User Management',   icon: <HiUserGroup />,             path: '/dashboard/admin/users',  roles: ['admin'] },
    { label: 'Settings',          icon: <HiCog6Tooth />,             path: '/dashboard/settings',     roles: ['admin', 'technician', 'user'] },
  ];

  const visibleMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  // Shared aside class: drawer on mobile, static on desktop
  const asideClass = `
    fixed inset-y-0 left-0 z-50
    lg:static lg:z-auto lg:translate-x-0
    flex w-64 h-screen shadow-md flex-col border-r
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}
  `;

  if (isLoading) {
    return (
      <aside className={asideClass}>
        <div className="h-20 border-b flex items-center justify-center p-4">
          <div className="w-3/4 h-8 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <nav className="flex-1 px-4 py-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-10 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <aside className={asideClass}>
      {/* Logo row — close button on mobile */}
      <div className={`h-20 flex items-center justify-between px-4 border-b
        ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
        <NavLink to="/dashboard" onClick={onClose} className="flex items-center">
          <img
            src="/Logo.png"
            alt="ENTECH SI Logo"
            className="h-12 object-contain cursor-pointer hover:opacity-80 transition-opacity"
          />
        </NavLink>
        {/* Close button — visible on mobile/tablet only */}
        <button
          onClick={onClose}
          className={`lg:hidden p-1.5 rounded-md transition-colors
            ${theme === 'dark'
              ? 'text-gray-400 hover:text-white hover:bg-slate-700'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
          aria-label="Close menu"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {visibleMenuItems.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.label === 'Dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200
                   ${isActive
                    ? theme === 'dark' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'
                    : theme === 'dark' ? 'text-gray-300 hover:bg-blue-800 hover:text-white'
                                       : 'text-gray-700 hover:bg-blue-200 hover:text-blue-700'
                  }`}
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
