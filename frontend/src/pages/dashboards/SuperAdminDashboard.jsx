import { useState, useEffect } from "react";
import { Users, FileCheck2, FileText, Tag, CreditCard, Building2, Activity, Cpu, Database, AlertTriangle, HeartPulse, ShieldAlert, Flag } from "lucide-react";
import api from "../../api/axios.js";
import StatCard from "../../components/ui/StatCard.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function SuperAdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/admin/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Super Admin dashboard</h1>
        <p className="text-sm text-muted mt-0.5">Platform-wide system overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}      label="Total Users" value={stats?.total_users} loading={loading} />
        <StatCard icon={FileCheck2} label="Pending Verifications" value={stats?.pending_verifications} loading={loading} />
        <StatCard icon={FileText}   label="Total Records" value={stats?.total_records} loading={loading} />
        <StatCard icon={Tag}        label="Roles Tracked" value={stats ? Object.keys(stats.role_distribution).length : null} loading={loading} />
      </div>

      <p className="text-xs text-muted mb-3">
        Multi-tenant and billing infrastructure below is outside the current MediLocker scope — placeholders for future expansion.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={CreditCard}    title="Revenue" note="Future" />
        <ComingSoonCard icon={Building2}     title="Active Organizations" note="Future" />
        <ComingSoonCard icon={Activity}      title="API Usage" note="Future" />
        <ComingSoonCard icon={Cpu}           title="AI Usage" note="Future" />
        <ComingSoonCard icon={Database}      title="Storage Metrics" note="Future" />
        <ComingSoonCard icon={Database}      title="Database Health" note="Future" />
        <ComingSoonCard icon={AlertTriangle} title="Error Monitoring" note="Future" />
        <ComingSoonCard icon={HeartPulse}    title="System Health" note="Future" />
        <ComingSoonCard icon={ShieldAlert}   title="Security Events" note="Future" />
        <ComingSoonCard icon={Flag}          title="Feature Flags" note="Future" />
      </div>
    </div>
  );
}