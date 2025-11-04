import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

interface RegisterForm {
  username: string;
  email: string;
  fullName: string;
  password: string;
  rePassword: string;
}

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    username: "",
    email: "",
    fullName: "",
    password: "",
    rePassword: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fields
    if (
      !form.username ||
      !form.email ||
      !form.fullName ||
      !form.password ||
      !form.rePassword
    ) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.rePassword) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      fullName: form.fullName,
      role: "user",
    };

    try {
      console.log('🚀 Requesting to:', api.defaults.baseURL + '/auth/register');
      console.log('📦 Payload:', payload);
      const res = await api.post("/auth/register", payload);
      console.log("res: ", res)
      setMessage(res.data.message || "Registered successfully");
      setError("");

      setForm({
        username: "",
        email: "",
        fullName: "",
        password: "",
        rePassword: "",
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
    console.log("❌ Full Error Object:", err);
    console.log("❌ Error Response:", err.response);
    console.log("❌ Error Response Data:", err.response?.data);
    console.log("❌ Error Response Status:", err.response?.status);
    console.log("❌ Error Message:", err.message);
    console.log("❌ Error Request:", err.request);
    console.log("❌ Error Config:", err.config);
    
    const msg = err.response?.data?.message;
    const statusCode = err.response?.status;
    
    console.log("📋 Extracted Message:", msg);
    console.log("📋 Status Code:", statusCode);
    
    // More detailed error messages
    if (!err.response) {
      // Network error - couldn't reach the server
      setError("Network error: Cannot reach the server. Is the backend running?");
      console.error("🔥 Network Error - Server unreachable");
    } else if (statusCode === 400) {
      setError(msg || "Bad request - check your input");
    } else if (statusCode === 409 || msg?.toLowerCase().includes("exists")) {
      setError("Username or email already in use");
    } else if (statusCode === 500) {
      setError("Server error - please try again later");
    } else {
      setError(msg || `Registration failed (Error ${statusCode})`);
    }
    
    setMessage("");
  }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md p-6 rounded w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        {message && (
          <p className="text-green-600 mb-3 text-center">{message}</p>
        )}
        {error && <p className="text-red-600 mb-3 text-center">{error}</p>}

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full mb-3 p-2 border rounded"
          required
        />
        <input
          type="password"
          name="rePassword"
          placeholder="Repeat Password"
          value={form.rePassword}
          onChange={handleChange}
          className={`w-full p-2 border rounded mb-3 ${form.rePassword && form.password !== form.rePassword
              ? "border-red-500"
              : ""
            }`}
          required
        />
        {form.rePassword && form.password !== form.rePassword && (
          <p className="text-red-600 text-sm mb-3">
            Passwords do not match
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 mb-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </button>

        <p className="text-sm mt-4 text-center">
          Already have an account?{" "}
          <span
            className="text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
