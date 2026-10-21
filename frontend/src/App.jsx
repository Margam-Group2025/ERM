import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// employee
import EmployeeDashboard from "./pages/EmployeeDashboard";
import MyTasks from "./pages/MyTasks";
import MyReports from "./pages/MyReports";
import EditReport from "./pages/EditReport";

// team lead
import TeamLeadDashboard from "./pages/TeamLeadDashboard";
import AssignTask from "./pages/AssignTask";
import TeamExport from "./pages/TeamExport";
import EditRequests from "./pages/EditRequest";

// admin
import AdminLayout from "./layout/AdminLayout";
import TemplateBuilder from "./pages/TemplateBuilder";
import AddUser from "./pages/AddUser";
import ManageUsers from "./pages/ManageUsers";
import AdminReports from "./pages/AdminReports";
import AdminTasks from "./pages/AdminTasks";
import ExportReports from "./pages/ExportReports";
import CrmGroups from "./pages/CrmGroups";
import AdminReviewQueue from "./pages/AdminReviewQueue";
import Admingroupreports from "./pages/Admingroupreports";

const only = (roles, element) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Employee */}
        <Route path="/dashboard" element={only(["employee"], <EmployeeDashboard />)} />
        <Route path="/tasks" element={only(["employee"], <MyTasks />)} />
        <Route path="/my-reports" element={only(["employee"], <MyReports />)} />

        {/* Employee + Team Lead: edit own report (needs an approved edit request) */}
        <Route
          path="/reports/:id/edit"
          element={only(["employee", "teamlead"], <EditReport />)}
        />

        {/* Team Lead */}
        <Route path="/teamlead" element={only(["teamlead"], <TeamLeadDashboard />)} />
        <Route path="/teamlead/report" element={only(["teamlead"], <EmployeeDashboard />)} />
        <Route path="/teamlead/tasks" element={only(["teamlead"], <AssignTask />)} />
        <Route path="/teamlead/my-tasks" element={only(["teamlead"], <MyTasks />)} />
        <Route path="/teamlead/my-reports" element={only(["teamlead"], <MyReports />)} />
        <Route path="/teamlead/export" element={only(["teamlead"], <TeamExport />)} />
        <Route path="/teamlead/edit-requests" element={only(["teamlead"], <EditRequests />)} />

        {/* Admin — AdminLayout renders the sidebar, these pages render inside it */}
        <Route path="/admin" element={only(["admin"], <AdminLayout />)}>
          <Route index element={<TemplateBuilder />} />
          <Route path="users" element={<AddUser />} />
          <Route path="team" element={<ManageUsers />} />
          <Route path="groups" element={<CrmGroups />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="final-review" element={<AdminReviewQueue />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="edit-requests" element={<EditRequests />} />
          <Route path="export" element={<ExportReports />} />
          <Route path="group-reports" element={<Admingroupreports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;