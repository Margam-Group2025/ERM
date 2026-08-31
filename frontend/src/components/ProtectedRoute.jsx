import { Navigate } from "react-router-dom";

/**
 * Wraps a route element and only renders it if:
 * 1. A token exists in localStorage (user is logged in)
 * 2. The logged-in user's role is in `allowedRoles` (if specified)
 *
 * Usage:
 *   <Route path="/admin" element={
 *     <ProtectedRoute allowedRoles={["admin"]}>
 *       <AdminLayout />
 *     </ProtectedRoute>
 *   } />
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    // not logged in at all — send to login
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // logged in, but wrong role — send them to their own dashboard instead
    // of the one they tried to access
    const destination =
      role === "admin" ? "/admin" : role === "teamlead" ? "/teamlead" : "/dashboard";
    return <Navigate to={destination} replace />;
  }

  return children;
}