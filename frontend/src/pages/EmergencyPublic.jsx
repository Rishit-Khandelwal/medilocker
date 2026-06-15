import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// Separate instance — no auth interceptor; no redirect on 401
const publicApi = axios.create({ baseURL: "/api" });

const ERROR_MESSAGES = {
  404: "This emergency code is invalid.",
  410: null, // use detail from server
};

export default function EmergencyPublic() {
  const { token }          = useParams();
  const [data, setData]    = useState(null);
  const [error, setError]  = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.get(`/emergency/access/${token}/`)
      .then(({ data: d }) => setData(d))
      .catch((err) => {
        const code   = err.response?.status;
        const detail = err.response?.data?.detail;
        setError(detail || ERROR_MESSAGES[code] || "Something went wrong.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const print = () => window.print();

  if (loading) return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-4 border-red-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-red-50">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-5 text-center print:py-3">
        <p className="text-xs font-semibold tracking-widest uppercase opacity-80">Emergency Medical Information</p>
        <h1 className="text-2xl font-bold mt-1">{data.patient_name}</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Blood group — most critical, shown first */}
        <Card icon="🩸" title="Blood Type">
          <p className="text-3xl font-bold text-red-700">{data.blood_group || "Not specified"}</p>
        </Card>

        {data.allergies && (
          <Card icon="⚠️" title="Allergies" accent="amber">
            <p className="text-sm text-gray-800 whitespace-pre-line">{data.allergies}</p>
          </Card>
        )}

        {data.conditions && (
          <Card icon="🏥" title="Medical Conditions">
            <p className="text-sm text-gray-800 whitespace-pre-line">{data.conditions}</p>
          </Card>
        )}

        {data.medications && (
          <Card icon="💊" title="Current Medications">
            <p className="text-sm text-gray-800 whitespace-pre-line">{data.medications}</p>
          </Card>
        )}

        {data.contacts?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📞</span>
              <h2 className="font-semibold text-gray-900 text-sm">Emergency Contacts</h2>
            </div>
            <div className="space-y-3">
              {data.contacts.map((c, i) => (
                <div key={i} className={`flex items-start justify-between gap-2 ${
                  i < data.contacts.length - 1 ? "pb-3 border-b border-gray-100" : ""
                }`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                      {c.is_primary && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 capitalize">{c.relationship}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </div>
                  <a href={`tel:${c.phone}`}
                    className="text-sm font-bold text-green-700 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100 whitespace-nowrap">
                    {c.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print / disclaimer */}
        <div className="text-center space-y-3 pt-2 print:hidden">
          <button onClick={print}
            className="px-6 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            🖨️ Print this page
          </button>
          <p className="text-xs text-gray-400">
            This is a one-time emergency access link and is now expired.
            Contact the patient or their doctor for full medical history.
          </p>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}