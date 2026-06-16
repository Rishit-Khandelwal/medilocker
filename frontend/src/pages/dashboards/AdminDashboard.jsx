import { useState, useEffect } from "react";
import { Users, FileCheck2, FileText, Tag, CircleDot, ShieldAlert, Database, Flag } from "lucide-react";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

const BACKEND_ORIGIN = "http://localhost:8000"; // TODO: env var for production

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
        <h1 className="text-xl font-semibold text-foreground">Admin dashboard</h1>
        <p className="text-sm text-muted mt-0.5">System overview &amp; moderation</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}      label="Total Users" value={stats?.total_users} loading={loading} />
        <a href={`${BACKEND_ORIGIN}/admin/accounts/verificationrequest/?status=PENDING`} target="_blank" rel="noreferrer">
          <StatCard icon={FileCheck2} label="Pending Verifications" value={stats?.pending_verifications} loading={loading} accent />
        </a>
        <StatCard icon={FileText}   label="Total Records" value={stats?.total_records} loading={loading} />
        <StatCard icon={Tag}        label="Roles Tracked" value={stats ? Object.keys(stats.role_distribution).length : null} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Role distribution</h3>
          {loading ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats?.role_distribution || {}).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between text-sm">
                  <span className="text-muted capitalize">{role.toLowerCase()}</span>
                  <span className="font-medium text-foreground tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Recent audit activity</h3>
          {loading ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : audit.length === 0 ? (
            <p className="text-xs text-muted">No activity yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {audit.slice(0, 12).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-xs border-b border-border last:border-0 pb-1.5">
                  <span className="text-foreground">
                    <span className="font-medium">{a.action_display}</span>
                    {a.user_email ? ` · ${a.user_email}` : ""}
                  </span>
                  <span className="text-muted flex-shrink-0 ml-2">
                    {new Date(a.timestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={CircleDot}   title="Active Sessions" note="Future" />
        <ComingSoonCard icon={ShieldAlert} title="Security Alerts" note="Future" />
        <ComingSoonCard icon={Database}    title="Storage Usage" note="Future" />
        <ComingSoonCard icon={Flag}        title="Abuse Reports" note="Future" />
      </div>
    </div>
  );
}