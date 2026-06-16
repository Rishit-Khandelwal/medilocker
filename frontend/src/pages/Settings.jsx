import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/auth/profile/")
      .then(({ data }) => {
        setProfile(data);
        setForm({
          date_of_birth: data.date_of_birth || "",
          blood_group:   data.blood_group   || "",
          phone:         data.phone         || "",
          allergies:     data.allergies     || "",
          conditions:    data.conditions    || "",
          medications:   data.medications   || "",
        });
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const { data } = await api.patch("/auth/profile/", form);
      setProfile(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-6">Manage your account and health profile</p>

        {/* Account info — read-only */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Account</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={user?.email} />
            <Row label="Username" value={user?.username} />
            <Row label="Role" value={
              <span className="capitalize">{user?.role?.toLowerCase()}</span>
            } />
            {user?.role !== "PATIENT" && (
              <Row label="Verified" value={user?.is_verified ? "✅ Yes" : "⏳ Pending"} />
            )}
          </dl>
        </div>

        {/* Health profile — editable */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">Health Profile</h3>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-sm">Saved ✓</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of birth</label>
              <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Blood group</label>
              <select value={form.blood_group} onChange={set("blood_group")} className={inputCls}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={set("phone")} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Allergies</label>
            <textarea rows={2} value={form.allergies} onChange={set("allergies")} className={inputCls} placeholder="Comma-separated" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Conditions</label>
            <textarea rows={2} value={form.conditions} onChange={set("conditions")} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Medications</label>
            <textarea rows={2} value={form.medications} onChange={set("medications")} className={inputCls} />
          </div>

          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-50 last:border-0 pb-2">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-800 font-medium">{value}</dd>
    </div>
  );
}