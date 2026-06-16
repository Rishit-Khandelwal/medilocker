import { useState, useEffect } from "react";
import { Siren, ScanLine, HeartPulse, Phone, History, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import Card from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function ResponderDashboard() {
  const { user } = useAuth();
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get("/security/emergency-accesses/")
      .then(({ data }) => setAccesses(data.results ?? data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Welcome, {user?.first_name || user?.username}</h1>
        <p className="text-sm text-muted mt-0.5">Emergency Responder dashboard</p>
      </div>

      <Card className="mb-5">
        <h3 className="font-medium text-foreground text-sm mb-3">Recent emergency accesses</h3>
        {loading ? (
          <p className="text-xs text-muted">Loading…</p>
        ) : accesses.length === 0 ? (
          <EmptyState icon={Siren} title="No emergency token scans recorded yet" />
        ) : (
          <div className="space-y-2">
            {accesses.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border last:border-0 pb-2">
                <span className="text-foreground">Token #{a.resource_id} accessed</span>
                <span className="text-xs text-muted">
                  {new Date(a.timestamp).toLocaleString("en-IN")}{a.ip_address ? ` · ${a.ip_address}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon={ScanLine}   title="QR Scanner" note="Future" />
        <ComingSoonCard icon={HeartPulse} title="Critical Medical Information" note="Future" />
        <ComingSoonCard icon={Siren}      title="Active Emergency Cases" note="Future" />
        <ComingSoonCard icon={Phone}      title="Emergency Contacts" note="Future" />
        <ComingSoonCard icon={History}    title="Access History" note="Future" />
        <ComingSoonCard icon={MapPin}     title="Location / Map" note="Future" />
      </div>
    </div>
  );
}