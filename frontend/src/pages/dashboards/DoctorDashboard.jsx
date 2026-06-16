import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
import ComingSoonCard from "../../components/ComingSoonCard.jsx";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    api.get("/auth/verification-status/")
      .then(({ data }) => setVerification(data))
      .catch(() => {}); // 404 = approved directly by admin with no request on file
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome, Dr. {user?.last_name || user?.username}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Doctor dashboard</p>
      </div>

      {/* Real: account/verification status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Account status</p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            ✅ Verified Doctor
            {verification?.reviewed_at && (
              <span className="text-gray-400 font-normal">
                {" "}since {new Date(verification.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </p>
        </div>
        <span className="text-2xl">🩺</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon="📋" title="Today's Queue"          note="Future" />
        <ComingSoonCard icon="📅" title="Upcoming Appointments"  note="Phase 5" />
        <ComingSoonCard icon="🔎" title="Patient Search"         note="Future" />
        <ComingSoonCard icon="🗒️" title="Recent Consultations"   note="Future" />
        <ComingSoonCard icon="📄" title="Pending Reports"        note="Future" />
        <ComingSoonCard icon="🤖" title="AI Report Summaries"    note="Phase 8" />
        <ComingSoonCard icon="💊" title="Prescription History"   note="Future" />
        <ComingSoonCard icon="⚠️" title="Drug Interaction Alerts" note="Future" />
        <ComingSoonCard icon="🚨" title="Emergency Cases"        note="Future" />
        <ComingSoonCard icon="💬" title="Messages"               note="Future" />
      </div>
    </div>
  );
}