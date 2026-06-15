import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Wrap any route element with <RoleGuard roles={["ADMIN","SUPERADMIN"]}>
 * to restrict access by role.  Falls back to /dashboard if role not allowed.
 */
export default function RoleGuard({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}