import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import Layout from "../components/Layout.jsx";
import api from "../api/axios.js";

export default function Dashboard() {
  const { user }                = useAuth();
  const [stats, setStats]       = useState({ total: 0, by_category: {} });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    api.get("/records/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || user?.email;

  const CARDS = [
    { label: "Records",       value: stats.total,  icon: "📋", to: "/records",  live: true },
    { label: "Appointments",  value: 0,             icon: "📅", to: null,        note: "Phase 5" },
    { label: "Medications",   value: 0,             icon: "💊", to: null,        note: "Phase 5" },
    { label: "Notifications", value: 0,             icon: "🔔", to: null,        note: "Phase 6" },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome, {name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your personal health vault</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CARDS.map(({ label, value, icon, to, live, note }) => {
          const inner = (
            <div className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between transition-colors ${
              to ? "hover:border-primary-300 cursor-pointer" : ""
            }`}>
              <div>
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {live && statsLoading ? "…" : value}
                </p>
                {note && <p className="text-xs text-gray-300 mt-0.5">{note}</p>}
              </div>
              <span className="text-2xl opacity-50">{icon}</span>
            </div>
          );
          return to
            ? <Link key={label} to={to}>{inner}</Link>
            : <div key={label}>{inner}</div>;
        })}
      </div>

      {/* Quick actions + panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Records</h3>
            <Link to="/records" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </Link>
          </div>
          {statsLoading ? (
            <div className="py-6 flex justify-center">
              <div className="h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats.total === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📁</div>
              <p className="text-xs">No records yet</p>
              <Link to="/records/upload"
                className="mt-3 inline-block px-3 py-1.5 bg-primary-600 text-white text-xs rounded-lg hover:bg-primary-700">
                Upload first record
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{cat.replace("_", " ")}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">Upcoming Appointments</h3>
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-xs">Coming in Phase 5</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}