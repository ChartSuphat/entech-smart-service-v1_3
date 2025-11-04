// 👇 Updated imports
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    const res = await api.post("/auth/login", { username, password });
    console.log("✅ Login Response:", res.data);

    // ✅ SECURE: Only save user data (token is in HTTP-only cookie)
    localStorage.setItem("user", JSON.stringify(res.data.user));
    
    // REMOVED: Don't store token in localStorage
    // localStorage.setItem("token", res.data.token);

    console.log("User data saved to localStorage");
    console.log("Token stored in HTTP-only cookie automatically");

    navigate("/dashboard");
  } catch (err: any) {
    console.error("Login failed:", err.response?.data?.message || err.message);
    setError(err.response?.data?.message || "Something went wrong");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/LoginBaclground.jpg')" }}
    >
      <div className="bg-white/5 backdrop-blur-md text-white p-6 sm:p-10 rounded-2xl w-[90%] max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-1">
          <img src="/Logo.png" alt="ENTECH SI" className="h-13" />
        </div>

        {/* App Name */}
        <h2 className="text-2xl font-bold text-center mb-4">
          Entech Smart Service
        </h2>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-2 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label
              htmlFor="username"
              className="block mb-2 text-sm font-medium"
            >
              Login
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Email or username"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-300 border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {/* Register Button */}
          <button
            type="button"
            onClick={() => navigate("/register")}
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold shadow-md transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-center mt-10 text-sm text-gray-200">
          © 2025 ENTECH SI CO., LTD.
        </p>
      </div>
    </div>
  );
};

export default Login;