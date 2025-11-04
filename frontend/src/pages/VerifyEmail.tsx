import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../utils/axios";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying...");
  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`/auth/verify-email?token=${token}`);
        setStatus(res.data.message || "Email verified successfully!");
      } catch (error: any) {
        setStatus(
          error.response?.data?.message || "Verification failed or token invalid."
        );
      }
    };

    if (token) verify();
    else setStatus("No token provided.");
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Email Verification</h2>
        <p className="text-gray-700">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;
