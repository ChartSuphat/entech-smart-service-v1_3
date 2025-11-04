import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers/CustomerPage";
import SettingPage from "./pages/Setting";
import DevicesPage from "./pages/Devices/Devicepage"; // ✅ Import Devices Page

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard Layout with nested routes */}
      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="customers" element={<Customers />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="settings" element={<SettingPage />} />
      </Route>
    </Routes>
  );
}