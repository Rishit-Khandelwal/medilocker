import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const NAV = [
  { to: "/dashboard",        label: "Dashboard" },
  { to: "/records",          label: "Records" },
  { to: "/emergency/manage", label: "Emergency" },
  // Phase 5: { to: "/timeline",  label: "Timeline" },
  // Phase 8: { to: "/ai",        label: "AI Assistant" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 h-14 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">MediLocker</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              {NAV.map(({ to, label }) => (
                <Link key={to} to={to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(to)
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-400 hidden sm:block">{user?.email}</span>
            {user?.role && user.role !== "PATIENT" && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full hidden sm:block capitalize">
                {user.role.toLowerCase()}
              </span>
            )}
            <button onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}