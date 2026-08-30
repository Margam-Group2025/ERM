import { BrowserRouter, Routes, Route } from "react-router-dom";
import ExportReports from "./pages/ExportReports";
import Login from "./pages/Login";
import TeamLeadDashboard from "./pages/TeamLeadDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AddUser from "./pages/AddUser";
import AdminLayout from "./layout/AdminLayout";
import TemplateBuilder from "./pages/TemplateBuilder";
import AssignTask from "./pages/AssignTask";
import MyTasks from "./pages/MyTasks";
import ProtectedRoute from "./components/ProtectedRoute";
import ManageUsers from "./pages/ManageUsers";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} />

        {/* Team Lead Dashboard — only teamlead can access */}
        <Route
          path="/teamlead"
          element={
            <ProtectedRoute allowedRoles={["teamlead"]}>
              <TeamLeadDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teamlead/tasks"
          element={
            <ProtectedRoute allowedRoles={["teamlead"]}>
              <AssignTask />
            </ProtectedRoute>
          }
        />

        {/* Employee Dashboard — only employee can access */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <MyTasks />
            </ProtectedRoute>
          }
        />

        {/* Admin section — only admin can access */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TemplateBuilder />} />
          <Route path="users" element={<AddUser />} />
          <Route path="export" element={<ExportReports />} />
          <Route path="team" element={<ManageUsers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;