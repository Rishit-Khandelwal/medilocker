import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}