import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

const Topbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ fullName: string; role: string; avatar?: string; avatarUrl?: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Enhanced theme checking with localStorage listener
  useEffect(() => {
    const updateTheme = () => {
      const storedTheme = localStorage.getItem("theme") || "light";
      setTheme(storedTheme as 'light' | 'dark');

      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    updateTheme();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        updateTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateTheme, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Production-ready user data loading - no automatic API calls
  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);

          const userData = {
            fullName: parsed.fullName || parsed.username || 'User',
            role: parsed.role || 'user',
            avatar: parsed.avatar,
            avatarUrl: parsed.avatarUrl,
          };

          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUserData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        loadUserData();
      }
    };

    const handleUserUpdate = (e: CustomEvent) => {
      loadUserData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userDataUpdated', handleUserUpdate as EventListener);

    const interval = setInterval(() => {
      const currentUser = localStorage.getItem("user");
      if (currentUser !== JSON.stringify(user)) {
        loadUserData();
      }
    }, 2000);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleUserUpdate as EventListener);
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
const handleLogout = async () => {
  try {
    setIsLoggingOut(true);
    setDropdownOpen(false);

    // ✅ Use api instance - automatically includes credentials
    await api.post('/auth/logout');

    // ✅ Clear localStorage (user data only)
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');

    // ✅ Reset theme to light
    document.documentElement.classList.remove('dark');

    // ✅ Dispatch logout event
    window.dispatchEvent(new CustomEvent('userLogout'));

    // ✅ Clear user state
    setUser(null);
    
    // ✅ Redirect to login
    navigate('/login', { replace: true });

  } catch (error) {
    console.error('Logout error:', error);

    // ✅ Force logout even on error
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAuthenticated');
    document.documentElement.classList.remove('dark');

    setUser(null);
    navigate('/login', { replace: true });
  } finally {
    setIsLoggingOut(false);
  }
};
  // const handleLogout = async () => {
  //   try {
  //     setIsLoggingOut(true);
  //     setDropdownOpen(false);

  //     const response = await fetch('/api/auth/logout', {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     localStorage.removeItem('user');
  //     localStorage.removeItem('token');
  //     localStorage.removeItem('isAuthenticated');

  //     document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  //     document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

  //     document.documentElement.classList.remove('dark');

  //     window.dispatchEvent(new CustomEvent('userLogout'));

  //     setUser(null);
  //     navigate('/login', { replace: true });

  //   } catch (error) {
  //     console.error('Logout error:', error);

  //     localStorage.removeItem('user');
  //     localStorage.removeItem('token');
  //     localStorage.removeItem('isAuthenticated');
  //     document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  //     document.documentElement.classList.remove('dark');

  //     setUser(null);
  //     navigate('/login', { replace: true });
  //   } finally {
  //     setIsLoggingOut(false);
  //   }
  // };

  // Improved avatar URL logic to match SettingsPage approach
  const getAvatarUrl = () => {
    if (!user) return null;

    // Use relative path - nginx will proxy it to backend
    if (user.avatar) {
      // If avatar is just a filename like "ava-1-xxx.png"
      if (!user.avatar.startsWith('/') && !user.avatar.startsWith('http')) {
        return `/uploads/avatars/${user.avatar}`;
      }
      // If it's already a path like "/uploads/avatars/xxx.png"
      if (user.avatar.startsWith('/')) {
        return user.avatar;
      }
      // If it's a full URL, use as-is
      if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
        return user.avatar;
      }
    }

    // Fallback to avatarUrl if available
    if (user.avatarUrl) {
      if (user.avatarUrl.startsWith('/')) {
        return user.avatarUrl;
      }
      if (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) {
        return user.avatarUrl;
      }
    }

    return null;
  };

  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const avatarUrl = getAvatarUrl();

  return (
    <header className={`w-full h-14 sm:h-16 shadow-sm flex items-center justify-between px-3 sm:px-6 border-b transition-all duration-300 ${theme === 'dark'
        ? 'bg-slate-800 border-slate-700 text-white'
        : 'bg-white border-gray-200 text-gray-900'
      }`}>

      {/* Left side - Clickable logo on mobile that navigates to dashboard */}
      <div className="flex items-center space-x-4">
        {/* Mobile logo - clickable to go to dashboard */}
        <div className="lg:hidden flex items-center">
          <img
            src="/Logo.png"
            alt="ENTECH SI Logo"
            className="h-8 sm:h-10 object-contain cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/dashboard')}
          />
        </div>
      </div>

      {/* Right side - User profile */}
      <div className="relative flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
        {user ? (
          <>
            {/* User info - Show full info on mobile dropdown, simplified on topbar */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className={`text-sm font-medium transition-colors truncate max-w-[120px] lg:max-w-none ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                }`}>
                {user.fullName}
              </span>
              <span className={`text-xs capitalize transition-colors ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>
                {user.role}
              </span>
            </div>

            {/* Profile picture - responsive sizing */}
            <div
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 overflow-hidden ${theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 ring-slate-600'
                  : 'bg-gray-200 hover:bg-gray-300 ring-gray-300'
                } ${dropdownOpen ? 'ring-2' : ''} ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    console.error('Avatar image failed to load:', avatarUrl);
                    // Hide the image and show initials fallback
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const initialsDiv = parent.querySelector('.initials-fallback') as HTMLElement;
                      if (initialsDiv) {
                        initialsDiv.style.display = 'flex';
                      }
                    }
                  }}
                  onLoad={() => {
                    console.log('Avatar image loaded successfully:', avatarUrl);
                  }}
                />
              ) : null}

              {/* Initials fallback - responsive sizing */}
              <div
                className={`initials-fallback w-full h-full rounded-full flex items-center justify-center text-xs font-bold transition-colors ${avatarUrl ? 'hidden' : 'flex'
                  } ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  }`}
              >
                {getInitials()}
              </div>

              {/* Online indicator - intersecting green circle */}
              {!isLoggingOut && (
                <div className={`absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full shadow-lg z-10 transition-all duration-200 ${theme === 'dark' ? 'border-2 border-slate-800' : 'border-2 border-white'
                  }`}>
                  {/* Inner bright dot for better visibility */}
                  <div className="absolute inset-0.5 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Enhanced dropdown - responsive positioning */}
            {dropdownOpen && !isLoggingOut && (
              <div className={`absolute right-0 top-12 sm:top-14 w-44 sm:w-48 border rounded-lg shadow-lg z-50 transition-all duration-200 ${theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 shadow-slate-900/50'
                  : 'bg-white border-gray-200 shadow-gray-900/10'
                }`}>

                {/* User info in dropdown */}
                <div className={`px-3 sm:px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                    {user.fullName}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {user.role} account
                  </p>
                </div>

                {/* Settings button */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/dashboard/settings");
                  }}
                  className={`w-full flex items-center px-3 sm:px-4 py-3 text-sm transition-colors ${theme === 'dark'
                      ? 'text-gray-100 hover:bg-slate-700'
                      : 'text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <span className="mr-3">⚙️</span>
                  Settings
                </button>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`w-full flex items-center px-3 sm:px-4 py-3 text-sm transition-colors border-t ${theme === 'dark'
                      ? 'text-red-400 hover:bg-slate-700 border-slate-700'
                      : 'text-red-600 hover:bg-gray-100 border-gray-200'
                    } ${isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="mr-3">{isLoggingOut ? '⏳' : '🔓'}</span>
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Not logged in state - responsive button */
          <button
            onClick={() => navigate("/login")}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md transition-colors ${theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Topbar;