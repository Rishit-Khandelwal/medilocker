import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

// Phase 2+: swap the 0 values with real API calls
const CARDS = [
  { label: "Records",       icon: "📋", phase: "2" },
  { label: "Appointments",  icon: "📅", phase: "5" },
  { label: "Medications",   icon: "💊", phase: "5" },
  { label: "Notifications", icon: "🔔", phase: "6" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || user?.email;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 h-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">MediLocker</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Welcome, {name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your personal health vault</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {CARDS.map(({ label, icon, phase }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
              <span className="text-2xl opacity-50">{icon}</span>
            </div>
          ))}
        </div>

        {/* Placeholder panels — replaced in later phases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Recent Records" icon="📁" note="Phase 2" />
          <Panel title="Upcoming Appointments" icon="📅" note="Phase 5" />
        </div>
      </main>
    </div>
  );
}

function Panel({ title, icon, note }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">{title}</h3>
      <div className="text-center py-10 text-gray-400">
        <div className="text-3xl mb-2">{icon}</div>
        <p className="text-xs">Coming in {note}</p>
      </div>
    </div>
  );
}