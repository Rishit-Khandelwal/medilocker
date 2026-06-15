import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";

const RELATIONSHIPS = ["spouse","parent","child","sibling","friend","doctor","other"];

const STATUS_STYLE = {
  active:  "bg-green-100 text-green-800",
  used:    "bg-yellow-100 text-yellow-800",
  expired: "bg-gray-100 text-gray-600",
  revoked: "bg-red-100 text-red-700",
};

const BLANK_CONTACT = { name:"", phone:"", email:"", relationship:"other", is_primary:false };

export default function EmergencyManagement() {
  const [tab, setTab] = useState("contacts");

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Emergency Access</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage who can be reached in an emergency and generate one-time QR access codes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: "contacts", label: "Emergency Contacts" },
          { key: "tokens",   label: "QR Tokens" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "contacts" && <ContactsTab />}
      {tab === "tokens"   && <TokensTab />}
    </Layout>
  );
}

// ── Contacts ──────────────────────────────────────────────────────────────────

function ContactsTab() {
  const [contacts, setContacts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);   // contact object or null
  const [form, setForm]           = useState(BLANK_CONTACT);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get("/emergency/contacts/");
      setContacts(data.results ?? data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_CONTACT);
    setError("");
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email,
              relationship: c.relationship, is_primary: c.is_primary });
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        const { data } = await api.patch(`/emergency/contacts/${editing.id}/`, form);
        setContacts((prev) => prev.map((c) => c.id === data.id ? data : c));
      } else {
        const { data } = await api.post("/emergency/contacts/", form);
        setContacts((prev) => [data, ...prev.filter((c) => !(form.is_primary && c.is_primary))]);
      }
      setShowForm(false);
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(" ") : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this emergency contact?")) return;
    await api.delete(`/emergency/contacts/${id}/`);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
        <button onClick={openAdd}
          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          + Add Contact
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">
            {editing ? "Edit Contact" : "New Emergency Contact"}
          </h3>
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full name *</label>
              <input required value={form.name} onChange={set("name")} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
              <input required value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set("email")} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
              <select value={form.relationship} onChange={set("relationship")} className={inputCls}>
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_primary" checked={form.is_primary}
                onChange={set("is_primary")} className="rounded" />
              <label htmlFor="is_primary" className="text-sm text-gray-700">
                Set as primary contact
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Add Contact"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && contacts.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📞</div>
          <p className="text-sm font-medium text-gray-500">No emergency contacts yet</p>
        </div>
      )}

      <div className="space-y-3">
        {contacts.map((c) => (
          <div key={c.id}
            className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">{c.name}</span>
                <span className="text-xs text-gray-500 capitalize">{c.relationship_display}</span>
                {c.is_primary && (
                  <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full font-medium">
                    ★ Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">📞 {c.phone}</p>
              {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => openEdit(c)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
              <button onClick={() => handleDelete(c.id)}
                className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tokens ────────────────────────────────────────────────────────────────────

function TokensTab() {
  const [tokens, setTokens]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [label, setLabel]         = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGenForm, setShowGenForm] = useState(false);
  const [qrModal, setQrModal]     = useState(null);   // { qr_code_base64, emergency_url, ...tokenData }

  const fetchTokens = useCallback(async () => {
    try {
      const { data } = await api.get("/emergency/tokens/");
      setTokens(data.results ?? data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const { data } = await api.post("/emergency/tokens/", {
        label,
        frontend_base_url: window.location.origin,
      });
      setTokens((prev) => [data, ...prev]);
      setQrModal(data);
      setLabel("");
      setShowGenForm(false);
    } catch {
      alert("Failed to generate token.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this token? It will no longer grant access.")) return;
    await api.post(`/emergency/tokens/${id}/revoke/`);
    setTokens((prev) => prev.map((t) => t.id === id ? { ...t, status: "revoked" } : t));
  };

  const downloadQR = () => {
    if (!qrModal) return;
    const a = document.createElement("a");
    a.href     = `data:image/png;base64,${qrModal.qr_code_base64}`;
    a.download = "medilocker_emergency_qr.png";
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{tokens.length} token{tokens.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowGenForm((v) => !v)}
          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          Generate QR Token
        </button>
      </div>

      {/* Generate form */}
      {showGenForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-1">New Emergency QR</h3>
          <p className="text-xs text-gray-500 mb-4">
            Valid for <strong>15 minutes</strong>, one-time use. Generate fresh before each use.
          </p>
          <form onSubmit={handleGenerate} className="flex gap-3">
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="Optional label (e.g. Wallet card)"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
            <button type="submit" disabled={generating}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {generating ? "Generating…" : "Generate"}
            </button>
            <button type="button" onClick={() => setShowGenForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Token list */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && tokens.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔐</div>
          <p className="text-sm font-medium text-gray-500">No tokens yet — generate one above</p>
        </div>
      )}

      <div className="space-y-3">
        {tokens.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    {t.label || <span className="text-gray-400 italic">No label</span>}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status] || "bg-gray-100 text-gray-600"}`}>
                    {t.status}
                  </span>
                  {t.status === "active" && t.time_remaining != null && (
                    <span className="text-xs text-amber-600 font-medium">
                      ⏱ {Math.ceil(t.time_remaining / 60)}m remaining
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Created {new Date(t.created_at).toLocaleString("en-IN")}
                  {t.used_at && ` · Used ${new Date(t.used_at).toLocaleString("en-IN")}`}
                  {t.accessed_by_ip && ` by ${t.accessed_by_ip}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {t.qr_code_base64 && (
                  <button onClick={() => setQrModal(t)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium">View QR</button>
                )}
                {t.status === "active" && (
                  <button onClick={() => handleRevoke(t.id)}
                    className="text-xs text-red-400 hover:text-red-600 font-medium">Revoke</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 text-lg mb-1 text-center">Emergency QR Code</h2>
            <p className="text-xs text-center text-amber-600 font-medium mb-4">
              ⏱ Valid 15 min · One-time use · Scan now
            </p>
            <div className="flex justify-center mb-4">
              <img
                src={`data:image/png;base64,${qrModal.qr_code_base64}`}
                alt="Emergency QR code"
                className="w-52 h-52 border border-gray-200 rounded-lg"
              />
            </div>
            <p className="text-xs text-gray-400 break-all text-center mb-4">{qrModal.emergency_url}</p>
            <div className="flex gap-3">
              <button onClick={downloadQR}
                className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
                ↓ Download PNG
              </button>
              <button onClick={() => setQrModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}