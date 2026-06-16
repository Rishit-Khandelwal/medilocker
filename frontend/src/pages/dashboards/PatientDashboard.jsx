import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Phone, QrCode, Droplet, History, HeartPulse, Pill, FileQuestion, Users, Sparkles, Bell } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState({ total: 0, by_category: {} });
  const [recent, setRecent]     = useState([]);
  const [profile, setProfile]   = useState(null);
  const [contacts, setContacts] = useState([]);
  const [tokens, setTokens]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/records/stats/"),
      api.get("/records/", { params: { ordering: "-uploaded_at" } }),
      api.get("/auth/profile/"),
      api.get("/emergency/contacts/"),
      api.get("/emergency/tokens/"),
    ]).then(([s, r, p, c, t]) => {
      if (s.status === "fulfilled") setStats(s.value.data);
      if (r.status === "fulfilled") setRecent((r.value.data.results ?? r.value.data).slice(0, 4));
      if (p.status === "fulfilled") setProfile(p.value.data);
      if (c.status === "fulfilled") setContacts(c.value.data.results ?? c.value.data);
      if (t.status === "fulfilled") setTokens(t.value.data.results ?? t.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || user?.email;

  const activeTokens = tokens.filter((t) => t.status === "active").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {name}</h1>
        <p className="text-sm text-muted mt-0.5">Your personal health vault</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText} label="Records" value={stats.total} to="/records" loading={loading} accent />
        <StatCard icon={Phone}    label="Emergency Contacts" value={contacts.length} to="/emergency/manage" loading={loading} />
        <StatCard icon={QrCode}   label="Active QR Tokens" value={activeTokens} to="/emergency/manage" loading={loading} />
        <StatCard icon={Droplet}  label="Blood Group" value={profile?.blood_group || "—"} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Health overview</h3>
          {profile ? (
            <dl className="space-y-2.5 text-sm">
              <Row label="Allergies"   value={profile.allergies   || "None recorded"} />
              <Row label="Conditions"  value={profile.conditions  || "None recorded"} />
              <Row label="Medications" value={profile.medications || "None recorded"} />
            </dl>
          ) : (
            <p className="text-xs text-muted">Loading…</p>
          )}
          <p className="text-xs text-muted mt-3 pt-3 border-t border-border">
            Structured tracking arrives with the Timeline in Phase 5 — this reflects your profile for now.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">Recent records</h3>
            <Link to="/records" className="text-xs text-accent hover:underline font-medium">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={FileQuestion} title="No records yet"
              description="Upload your first medical document to get started." />
          ) : (
            <div className="space-y-1">
              {recent.map((r) => (
                <Link key={r.id} to={`/records/${r.id}`}
                  className="flex items-center justify-between text-sm hover:bg-bg -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <span className="text-foreground truncate">{r.title}</span>
                  <span className="text-xs text-muted capitalize flex-shrink-0 ml-2">{r.category_display}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={History}      title="Health Timeline" note="Phase 5" />
        <ComingSoonCard icon={HeartPulse}   title="Active Conditions" note="Phase 5" />
        <ComingSoonCard icon={Pill}         title="Current Medications" note="Phase 5" />
        <ComingSoonCard icon={FileQuestion} title="Insurance Policies & Claims" note="Future" />
        <ComingSoonCard icon={Users}        title="Family Vault" note="Future" />
        <ComingSoonCard icon={Sparkles}     title="AI Health Copilot" note="Phase 8" />
        <ComingSoonCard icon={Bell}         title="Notifications" note="Phase 6" />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground text-right max-w-[60%]">{value}</dd>
    </div>
  );
}