import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, Phone, QrCode, Droplet, Calendar, Pill, FileQuestion, Users, Sparkles, Bell, History, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [records,    setRecords]    = useState({ total: 0, by_category: {} });
  const [recent,     setRecent]     = useState([]);
  const [profile,    setProfile]    = useState(null);
  const [contacts,   setContacts]   = useState([]);
  const [tlStats,    setTlStats]    = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/records/stats/"),
      api.get("/records/", { params: { ordering: "-uploaded_at" } }),
      api.get("/auth/profile/"),
      api.get("/emergency/contacts/"),
      api.get("/timeline/patient-stats/"),
    ]).then(([s, r, p, c, t]) => {
      if (s.status === "fulfilled") setRecords(s.value.data);
      if (r.status === "fulfilled") setRecent((r.value.data.results ?? r.value.data).slice(0, 4));
      if (p.status === "fulfilled") setProfile(p.value.data);
      if (c.status === "fulfilled") setContacts(c.value.data.results ?? c.value.data);
      if (t.status === "fulfilled") setTlStats(t.value.data);
    }).finally(() => setLoading(false));
  }, []);

  const name = user?.first_name
    ? `${user.first_name} ${user.last_name}`.trim()
    : user?.username || user?.email;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {name}</h1>
        <p className="text-sm text-muted mt-0.5">Your personal health vault</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={FileText}  label="Records"      value={records.total}              to="/records"            loading={loading} accent />
        <StatCard icon={Calendar}  label="Appointments" value={tlStats?.total_appointments} to="/appointments"       loading={loading} />
        <StatCard icon={Pill}      label="Medications"  value={tlStats?.active_medications} to="/medications"        loading={loading} />
        <StatCard icon={Phone}     label="Emergency Contacts" value={contacts.length}       to="/emergency/manage"   loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Upcoming appointments */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">Upcoming Appointments</h3>
            <Link to="/appointments" className="text-xs text-accent hover:underline font-medium">View all</Link>
          </div>
          {loading ? (
            <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : tlStats?.upcoming?.length === 0 || !tlStats?.upcoming ? (
            <EmptyState icon={Calendar} title="No upcoming appointments"
              action={<Link to="/appointments" className="text-xs text-accent hover:underline font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Add appointment</Link>} />
          ) : (
            <div className="space-y-2">
              {tlStats.upcoming.map((a) => {
                const d = new Date(a.date);
                return (
                  <div key={a.id} className="flex items-center gap-3 text-sm hover:bg-bg -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                    <div className="text-center flex-shrink-0 w-8">
                      <p className="text-base font-semibold text-foreground leading-none">{d.getDate()}</p>
                      <p className="text-[10px] text-muted">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground font-medium truncate">Dr. {a.doctor_name}</p>
                      <p className="text-xs text-muted">
                        {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {a.hospital ? ` · ${a.hospital}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Records */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">Recent Records</h3>
            <Link to="/records" className="text-xs text-accent hover:underline font-medium">View all</Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={FileQuestion} title="No records yet"
              action={<Link to="/records/upload" className="text-xs text-accent hover:underline font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> Upload record</Link>} />
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

      {/* Health overview */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground text-sm">Health Overview</h3>
          <Link to="/settings" className="text-xs text-accent hover:underline font-medium">Edit</Link>
        </div>
        {profile ? (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted mb-1">Blood Group</dt>
              <dd className="font-semibold text-foreground text-lg flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-danger" />
                {profile.blood_group || "Not set"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Allergies</dt>
              <dd className="text-foreground text-sm">{profile.allergies || "None recorded"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted mb-1">Conditions</dt>
              <dd className="text-foreground text-sm">{profile.conditions || "None recorded"}</dd>
            </div>
          </dl>
        ) : (
          <div className="grid grid-cols-3 gap-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
        )}
      </Card>

      {/* Coming soon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ComingSoonCard icon={History}  title="Insurance Policies &amp; Claims" note="Future" />
        <ComingSoonCard icon={Users}    title="Family Vault"     note="Future" />
        <ComingSoonCard icon={Sparkles} title="AI Health Copilot" note="Phase 8" />
        <ComingSoonCard icon={Bell}     title="Notifications"    note="Phase 6" />
      </div>
    </div>
  );
}