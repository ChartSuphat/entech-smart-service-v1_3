import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers/CustomerPage";
import Tools from "./pages/Tools/ToolsPage";
import Equipment from "./pages/Equipment/EquipmentPage";
import CertificatePage from "./pages/Certificates/CertificatePage";
import DevicesPage from "./pages/Devices/Devicepage"; // ✅ ADD THIS IMPORT
import Setting from "./pages/Setting";
import Modal from 'react-modal';
import AdminUserManagement from './pages/AdminUserManagement/AdminUserManagement';

Modal.setAppElement('#root');

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes inside layout */}
      <Route path="/dashboard" element={<Dashboard />}>
        <Route path="customers" element={<Customers />} />
        <Route path="tools" element={<Tools />} />
        <Route path="equipment" element={<Equipment />} />
        <Route path="certificates" element={<CertificatePage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="settings" element={<Setting />} />
        <Route path="admin/users" element={<AdminUserManagement />} />
      </Route>
    </Routes>
  );
}