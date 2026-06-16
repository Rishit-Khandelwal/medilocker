import { useState, useEffect } from "react";
import { Stethoscope, ClipboardList, Calendar, Search, FileText, Sparkles, Pill, AlertTriangle, Siren, MessageSquare, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    api.get("/auth/verification-status/").then(({ data }) => setVerification(data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Welcome, Dr. {user?.last_name || user?.username}</h1>
        <p className="text-sm text-muted mt-0.5">Doctor dashboard</p>
      </div>

      <Card className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-muted">Account status</p>
          <p className="text-sm font-medium text-foreground mt-0.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" /> Verified Doctor
            {verification?.reviewed_at && (
              <span className="text-muted font-normal">
                since {new Date(verification.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </p>
        </div>
        <Stethoscope className="w-5 h-5 text-muted" />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={ClipboardList} title="Today's Queue" note="Future" />
        <ComingSoonCard icon={Calendar}      title="Upcoming Appointments" note="Phase 5" />
        <ComingSoonCard icon={Search}        title="Patient Search" note="Future" />
        <ComingSoonCard icon={FileText}      title="Recent Consultations" note="Future" />
        <ComingSoonCard icon={FileText}      title="Pending Reports" note="Future" />
        <ComingSoonCard icon={Sparkles}      title="AI Report Summaries" note="Phase 8" />
        <ComingSoonCard icon={Pill}          title="Prescription History" note="Future" />
        <ComingSoonCard icon={AlertTriangle} title="Drug Interaction Alerts" note="Future" />
        <ComingSoonCard icon={Siren}         title="Emergency Cases" note="Future" />
        <ComingSoonCard icon={MessageSquare} title="Messages" note="Future" />
      </div>
    </div>
  );
}