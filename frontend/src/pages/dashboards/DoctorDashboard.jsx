import { useState, useEffect } from "react";
import { Calendar, Clock, Users, CheckCircle2, Siren, Pill, ShieldCheck, Stethoscope, AlertTriangle, Sparkles, MessageSquare, FileText } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";
import { Skeleton } from "../../components/ui/Skeleton.jsx";

export default function DoctorDashboard() {
  const { user }    = useAuth();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get("/timeline/doctor-dashboard/")
      .then(({ data: d }) => setData(d))
      .catch(() => setError("Could not load doctor dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const name = user?.first_name
    ? `Dr. ${user.last_name || user.first_name}`
    : `Dr. ${user?.username || ""}`;

  if (loading) return (
    <div>
      <div className="mb-6">
        <div className="skeleton h-6 w-48 rounded mb-2" />
        <div className="skeleton h-4 w-32 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{name}</h1>
        <p className="text-sm text-muted mt-0.5">Doctor dashboard</p>
      </div>
      <Card>
        <p className="text-sm text-danger">{error}</p>
        <p className="text-xs text-muted mt-1">
          Make sure your account is verified with the DOCTOR role and you have appointments linked to your account via your MediLocker email.
        </p>
      </Card>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {name}</h1>
        <p className="text-sm text-muted mt-0.5">Doctor dashboard</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Calendar} label="Today's Appointments" value={data?.today_count ?? 0} accent />
        <StatCard icon={Users}    label="Total Patients" value={data?.total_patients ?? 0} />
        <StatCard icon={Pill}     label="Prescriptions Issued" value={data?.prescriptions?.length ?? 0} />
        <StatCard icon={Siren}    label="Emergency Cases" value={data?.emergency_cases?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Today's queue */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground text-sm">Today's Queue</h3>
            <span className="text-xs text-muted">
              {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          {data?.today?.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today"
              description="Patients link appointments to your account using your MediLocker email." />
          ) : (
            <div className="space-y-2">
              {data.today.map((a) => {
                const d = new Date(a.date);
                return (
                  <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                    <div className="w-14 flex-shrink-0 text-center">
                      <p className="text-xs font-medium text-foreground">{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{a.patient_name}</p>
                      {a.notes && <p className="text-xs text-muted truncate">{a.notes}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                      a.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                    }`}>
                      {a.status_display}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent consultations */}
        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Recent Consultations</h3>
          {data?.recent?.length === 0 ? (
            <EmptyState icon={Stethoscope} title="No past consultations yet"
              description="Completed appointments will appear here." />
          ) : (
            <div className="space-y-2">
              {data.recent.map((a) => {
                const d = new Date(a.date);
                return (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                    <div>
                      <p className="font-medium text-foreground">{a.patient_name}</p>
                      {a.hospital && <p className="text-xs text-muted">{a.hospital}</p>}
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs text-foreground">{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        a.status === "COMPLETED" ? "bg-success/10 text-success" : "bg-bg text-muted border border-border"
                      }`}>
                        {a.status_display}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Prescription history */}
        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Prescription History</h3>
          {data?.prescriptions?.length === 0 ? (
            <EmptyState icon={Pill} title="No prescriptions issued yet"
              description="Prescriptions you issue through MediLocker will appear here." />
          ) : (
            <div className="space-y-2">
              {data.prescriptions.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-medium text-foreground">{m.medicine}</p>
                    <p className="text-xs text-muted">{m.dose} · {m.frequency}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${m.is_active ? "bg-success/10 text-success" : "bg-bg text-muted border border-border"}`}>
                    {m.is_active ? "Active" : "Stopped"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Emergency cases */}
        <Card>
          <h3 className="font-medium text-foreground text-sm mb-3">Emergency Cases</h3>
          {data?.emergency_cases?.length === 0 ? (
            <EmptyState icon={Siren} title="No emergency accesses recorded" />
          ) : (
            <div className="space-y-2">
              {data.emergency_cases.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Siren className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                    <span className="text-foreground">Token #{e.resource_id} accessed</span>
                  </div>
                  <span className="text-muted flex-shrink-0 ml-2">
                    {new Date(e.timestamp).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming */}
      {data?.upcoming?.length > 0 && (
        <Card className="mb-5">
          <h3 className="font-medium text-foreground text-sm mb-3">Upcoming Appointments</h3>
          <div className="space-y-2">
            {data.upcoming.map((a) => {
              const d = new Date(a.date);
              return (
                <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                  <div className="text-center flex-shrink-0 w-10">
                    <p className="text-base font-semibold text-foreground leading-none">{d.getDate()}</p>
                    <p className="text-[10px] text-muted">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{a.patient_name}</p>
                    <p className="text-xs text-muted">{d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{a.hospital ? ` · ${a.hospital}` : ""}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={FileText}      title="Pending Reports"          note="Future" />
        <ComingSoonCard icon={Sparkles}      title="AI Report Summaries"      note="Phase 8" />
        <ComingSoonCard icon={MessageSquare} title="Messages"                 note="Future" />
        <ComingSoonCard icon={AlertTriangle} title="Drug Interaction Alerts"  note="Future" />
      </div>
    </div>
  );
}