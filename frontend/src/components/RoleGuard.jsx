import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function RoleGuard({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}