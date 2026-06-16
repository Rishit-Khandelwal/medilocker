import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api/axios.js";
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
      if (r.status === "fulfilled") setRecent((r.value.data.results ?? r.value.data).slice(0, 3));
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
        <h1 className="text-xl font-bold text-gray-900">Welcome, {name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your personal health vault</p>
      </div>

      {/* Top stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Link to="/records" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-primary-300 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Records</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? "…" : stats.total}</p>
          </div>
          <span className="text-2xl opacity-50">📋</span>
        </Link>
        <Link to="/emergency/manage" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-primary-300 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Emergency Contacts</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? "…" : contacts.length}</p>
          </div>
          <span className="text-2xl opacity-50">📞</span>
        </Link>
        <Link to="/emergency/manage" className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between hover:border-primary-300 transition-colors">
          <div>
            <p className="text-xs font-medium text-gray-500">Active QR Tokens</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? "…" : activeTokens}</p>
          </div>
          <span className="text-2xl opacity-50">🔐</span>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">Blood Group</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{profile?.blood_group || "—"}</p>
          </div>
          <span className="text-2xl opacity-50">🩸</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Health Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Health Overview</h3>
          {profile ? (
            <dl className="space-y-2 text-sm">
              <Row label="Allergies"   value={profile.allergies   || "None recorded"} />
              <Row label="Conditions"  value={profile.conditions  || "None recorded"} />
              <Row label="Medications" value={profile.medications || "None recorded"} />
            </dl>
          ) : (
            <p className="text-xs text-gray-400">Loading…</p>
          )}
          <p className="text-xs text-gray-400 mt-3">Structured tracking arrives in Phase 5 — for now this reflects your profile.</p>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Recent Records</h3>
            <Link to="/records" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-2xl mb-1">📁</div>
              <p className="text-xs">No records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => (
                <Link key={r.id} to={`/records/${r.id}`}
                  className="flex items-center justify-between text-sm hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <span className="text-gray-700 truncate">{r.title}</span>
                  <span className="text-xs text-gray-400 capitalize flex-shrink-0 ml-2">{r.category_display}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Remaining sections — real where built, placeholder otherwise */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard icon="📅" title="Health Timeline"   note="Phase 5" />
        <ComingSoonCard icon="🏥" title="Active Conditions"  note="Phase 5" />
        <ComingSoonCard icon="💊" title="Current Medications" note="Phase 5" />
        <ComingSoonCard icon="🗂️" title="Insurance Policies & Claims" note="Future" />
        <ComingSoonCard icon="👪" title="Family Vault"        note="Future" />
        <ComingSoonCard icon="🤖" title="AI Health Copilot"   note="Phase 8" />
        <ComingSoonCard icon="🔔" title="Notifications"       note="Phase 6" />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-gray-800 mt-0.5">{value}</dd>
    </div>
  );
}