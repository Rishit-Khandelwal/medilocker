import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/auth/admin/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide system overview</p>
      </div>

      {/* Reuses the same real stats as Admin */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Total Users"     value={stats?.total_users} icon="👥" />
        <Stat label="Pending Verifications" value={stats?.pending_verifications} icon="🛂" />
        <Stat label="Total Records"   value={stats?.total_records} icon="📋" />
        <Stat label="Roles Tracked"   value={stats ? Object.keys(stats.role_distribution).length : null} icon="🏷️" />
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Multi-tenant / billing infrastructure below is outside the current MediLocker scope — placeholders for future expansion.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon="💰" title="Revenue"              note="Future" />
        <ComingSoonCard icon="🏢" title="Active Organizations" note="Future" />
        <ComingSoonCard icon="📡" title="API Usage"            note="Future" />
        <ComingSoonCard icon="🤖" title="AI Usage"             note="Future" />
        <ComingSoonCard icon="💾" title="Storage Metrics"      note="Future" />
        <ComingSoonCard icon="🗄️" title="Database Health"      note="Future" />
        <ComingSoonCard icon="🐞" title="Error Monitoring"     note="Future" />
        <ComingSoonCard icon="❤️" title="System Health"        note="Future" />
        <ComingSoonCard icon="🔒" title="Security Events"      note="Future" />
        <ComingSoonCard icon="🎛️" title="Feature Flags"        note="Future" />
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? "…"}</p>
      </div>
      <span className="text-2xl opacity-50">{icon}</span>
    </div>
  );
}