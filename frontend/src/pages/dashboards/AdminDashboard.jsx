import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

const BACKEND_ORIGIN = "http://localhost:8000"; // TODO: move to env var for production

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [audit, setAudit]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/auth/admin/stats/"),
      api.get("/security/recent/"),
    ]).then(([s, a]) => {
      if (s.status === "fulfilled") setStats(s.value.data);
      if (a.status === "fulfilled") setAudit(a.value.data.results ?? a.value.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">System overview &amp; moderation</p>
      </div>

      {/* Real stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Users" value={stats?.total_users} icon="👥" />
        <a href={`${BACKEND_ORIGIN}/admin/accounts/verificationrequest/?status=PENDING`} target="_blank" rel="noreferrer">
          <Stat label="Pending Verifications" value={stats?.pending_verifications} icon="🛂" highlight />
        </a>
        <Stat label="Total Records" value={stats?.total_records} icon="📋" />
        <Stat label="Roles Tracked" value={stats ? Object.keys(stats.role_distribution).length : null} icon="🏷️" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Role distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Role Distribution</h3>
          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.role_distribution || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">{role.toLowerCase()}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent audit activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Audit Activity</h3>
          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : audit.length === 0 ? (
            <p className="text-xs text-gray-400">No activity yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {audit.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs border-b border-gray-50 last:border-0 pb-1.5">
                  <span className="text-gray-700">
                    <span className="font-medium">{a.action_display}</span>
                    {a.user_email ? ` · ${a.user_email}` : ""}
                  </span>
                  <span className="text-gray-400 flex-shrink-0 ml-2">
                    {new Date(a.timestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon="🟢" title="Active Sessions" note="Future" />
        <ComingSoonCard icon="🛡️" title="Security Alerts" note="Future" />
        <ComingSoonCard icon="💾" title="Storage Usage"    note="Future" />
        <ComingSoonCard icon="🚩" title="Abuse Reports"    note="Future" />
      </div>
    </div>
  );
}

function Stat({ label, value, icon, highlight }) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex items-center justify-between transition-colors ${
      highlight ? "border-amber-300 hover:border-amber-400" : "border-gray-200"
    }`}>
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? "…"}</p>
      </div>
      <span className="text-2xl opacity-50">{icon}</span>
    </div>
  );
}