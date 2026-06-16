import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
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
        <h1 className="text-xl font-bold text-gray-900">Welcome, {user?.first_name || user?.username}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Emergency Responder dashboard</p>
      </div>

      {/* Real: emergency access log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Emergency Accesses</h3>
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : accesses.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <div className="text-2xl mb-1">🚑</div>
            <p className="text-xs">No emergency token scans recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accesses.slice(0, 10).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 pb-2">
                <span className="text-gray-700">Token #{a.resource_id} accessed</span>
                <span className="text-xs text-gray-400">
                  {new Date(a.timestamp).toLocaleString("en-IN")}{a.ip_address ? ` · ${a.ip_address}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon="📷" title="QR Scanner"               note="Future" />
        <ComingSoonCard icon="🩺" title="Critical Medical Information" note="Future" />
        <ComingSoonCard icon="🚨" title="Active Emergency Cases"   note="Future" />
        <ComingSoonCard icon="📞" title="Emergency Contacts"       note="Future" />
        <ComingSoonCard icon="🕓" title="Access History"           note="Future" />
        <ComingSoonCard icon="🗺️" title="Location / Map"           note="Future" />
      </div>
    </div>
  );
}