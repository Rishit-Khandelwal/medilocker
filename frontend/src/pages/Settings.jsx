import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const input = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/auth/profile/")
      .then(({ data }) => {
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
    try {
      await api.patch("/auth/profile/", form);
      toast("Settings saved.", "success");
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Layout breadcrumb={["Settings"]}>
      <div className="flex justify-center py-20">
        <div className="h-7 w-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout breadcrumb={["Settings"]}>
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted mb-6">Manage your account and health profile</p>

        <Card className="mb-5">
          <h3 className="font-medium text-foreground text-sm mb-3">Account</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Email" value={user?.email} />
            <Row label="Username" value={user?.username} />
            <Row label="Role" value={<span className="capitalize">{user?.role?.toLowerCase()}</span>} />
            {user?.role !== "PATIENT" && <Row label="Verified" value={user?.is_verified ? "Yes" : "Pending"} />}
          </dl>
        </Card>

        <Card as="form" onSubmit={handleSave} className="space-y-4">
          <h3 className="font-medium text-foreground text-sm mb-1">Health Profile</h3>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Date of birth</label>
              <input type="date" value={form.date_of_birth} onChange={set("date_of_birth")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Blood group</label>
              <select value={form.blood_group} onChange={set("blood_group")} className={input}>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Phone</label>
            <input value={form.phone} onChange={set("phone")} className={input} />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Allergies</label>
            <textarea rows={2} value={form.allergies} onChange={set("allergies")} className={input} placeholder="Comma-separated" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Conditions</label>
            <textarea rows={2} value={form.conditions} onChange={set("conditions")} className={input} />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Medications</label>
            <textarea rows={2} value={form.medications} onChange={set("medications")} className={input} />
          </div>

          <button type="submit" disabled={saving}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </Card>
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-border last:border-0 pb-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </div>
  );
}