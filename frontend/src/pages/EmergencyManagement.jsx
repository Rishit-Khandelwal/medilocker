import { useState, useEffect, useCallback } from "react";
import { Plus, Phone, Star, QrCode, Download, Loader2 } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const RELATIONSHIPS = ["spouse", "parent", "child", "sibling", "friend", "doctor", "other"];

const STATUS_STYLE = {
  active:  "bg-success/10 text-success",
  used:    "bg-warning/10 text-warning",
  expired: "bg-bg text-muted",
  revoked: "bg-danger/10 text-danger",
};

const BLANK_CONTACT = { name: "", phone: "", email: "", relationship: "other", is_primary: false };
const input = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function EmergencyManagement() {
  const [tab, setTab] = useState("contacts");

  return (
    <Layout breadcrumb={["Emergency"]}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Emergency Access</h1>
        <p className="text-sm text-muted mt-0.5">
          Manage who can be reached in an emergency and generate one-time QR access codes.
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-border">
        {[{ key: "contacts", label: "Emergency Contacts" }, { key: "tokens", label: "QR Tokens" }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"
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

function ContactsTab() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK_CONTACT);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const fetchContacts = useCallback(async () => {
    try {
      const { data } = await api.get("/emergency/contacts/");
      setContacts(data.results ?? data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const openAdd  = () => { setEditing(null); setForm(BLANK_CONTACT); setError(""); setShowForm(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, relationship: c.relationship, is_primary: c.is_primary });
    setError(""); setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      if (editing) {
        const { data } = await api.patch(`/emergency/contacts/${editing.id}/`, form);
        setContacts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      } else {
        const { data } = await api.post("/emergency/contacts/", form);
        setContacts((prev) => [data, ...prev.filter((c) => !(form.is_primary && c.is_primary))]);
      }
      setShowForm(false);
      toast(editing ? "Contact updated." : "Contact added.", "success");
    } catch (err) {
      const d = err.response?.data;
      setError(d ? Object.values(d).flat().join(" ") : "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this emergency contact?")) return;
    await api.delete(`/emergency/contacts/${id}/`);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast("Contact removed.", "success");
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted">{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</p>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>

      {showForm && (
        <Card className="mb-5">
          <h3 className="font-medium text-foreground text-sm mb-4">{editing ? "Edit Contact" : "New Emergency Contact"}</h3>
          {error && <p className="text-danger text-sm mb-3">{error}</p>}
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Full name *</label>
              <input required value={form.name} onChange={set("name")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Phone *</label>
              <input required value={form.phone} onChange={set("phone")} className={input} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Email</label>
              <input type="email" value={form.email} onChange={set("email")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Relationship</label>
              <select value={form.relationship} onChange={set("relationship")} className={input}>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_primary" checked={form.is_primary} onChange={set("is_primary")} className="accent-accent" />
              <label htmlFor="is_primary" className="text-sm text-foreground">Set as primary contact</label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Add Contact"}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border text-sm text-muted rounded-lg hover:bg-bg">
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}

      {!loading && contacts.length === 0 && !showForm && (
        <EmptyState icon={Phone} title="No emergency contacts yet" />
      )}

      <div className="space-y-3">
        {contacts.map((c) => (
          <Card key={c.id} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground text-sm">{c.name}</span>
                <span className="text-xs text-muted capitalize">{c.relationship_display}</span>
                {c.is_primary && (
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-medium">
                    <Star className="w-3 h-3 fill-current" /> Primary
                  </span>
                )}
              </div>
              <p className="text-sm text-muted mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
              {c.email && <p className="text-xs text-muted/70 mt-0.5">{c.email}</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => openEdit(c)} className="text-xs text-accent hover:underline font-medium">Edit</button>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-danger hover:underline font-medium">Delete</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TokensTab() {
  const { toast } = useToast();
  const [tokens, setTokens]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [label, setLabel]             = useState("");
  const [generating, setGenerating]   = useState(false);
  const [showGenForm, setShowGenForm] = useState(false);
  const [qrModal, setQrModal]         = useState(null);

  const fetchTokens = useCallback(async () => {
    try {
      const { data } = await api.get("/emergency/tokens/");
      setTokens(data.results ?? data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const { data } = await api.post("/emergency/tokens/", { label, frontend_base_url: window.location.origin });
      setTokens((prev) => [data, ...prev]);
      setQrModal(data);
      setLabel("");
      setShowGenForm(false);
    } catch {
      toast("Failed to generate token.", "error");
    } finally { setGenerating(false); }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm("Revoke this token? It will no longer grant access.")) return;
    await api.post(`/emergency/tokens/${id}/revoke/`);
    setTokens((prev) => prev.map((t) => (t.id === id ? { ...t, status: "revoked" } : t)));
    toast("Token revoked.", "success");
  };

  const downloadQR = () => {
    if (!qrModal) return;
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${qrModal.qr_code_base64}`;
    a.download = "medilocker_emergency_qr.png";
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted">{tokens.length} token{tokens.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setShowGenForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <QrCode className="w-3.5 h-3.5" /> Generate QR Token
        </button>
      </div>

      {showGenForm && (
        <Card className="mb-5">
          <h3 className="font-medium text-foreground text-sm mb-1">New Emergency QR</h3>
          <p className="text-xs text-muted mb-4">Valid for <strong>15 minutes</strong>, one-time use. Generate fresh before each use.</p>
          <form onSubmit={handleGenerate} className="flex gap-3">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Optional label (e.g. Wallet card)" className={input + " flex-1"} />
            <button type="submit" disabled={generating}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {generating ? "Generating…" : "Generate"}
            </button>
            <button type="button" onClick={() => setShowGenForm(false)} className="px-4 py-2 border border-border text-sm text-muted rounded-lg hover:bg-bg">
              Cancel
            </button>
          </form>
        </Card>
      )}

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}

      {!loading && tokens.length === 0 && (
        <EmptyState icon={QrCode} title="No tokens yet" description="Generate one above." />
      )}

      <div className="space-y-3">
        {tokens.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground text-sm">
                    {t.label || <span className="text-muted italic">No label</span>}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[t.status] || "bg-bg text-muted"}`}>
                    {t.status}
                  </span>
                  {t.status === "active" && t.time_remaining != null && (
                    <span className="text-xs text-warning font-medium">{Math.ceil(t.time_remaining / 60)}m remaining</span>
                  )}
                </div>
                <p className="text-xs text-muted mt-1">
                  Created {new Date(t.created_at).toLocaleString("en-IN")}
                  {t.used_at && ` · Used ${new Date(t.used_at).toLocaleString("en-IN")}`}
                  {t.accessed_by_ip && ` by ${t.accessed_by_ip}`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {t.qr_code_base64 && (
                  <button onClick={() => setQrModal(t)} className="text-xs text-accent hover:underline font-medium">View QR</button>
                )}
                {t.status === "active" && (
                  <button onClick={() => handleRevoke(t.id)} className="text-xs text-danger hover:underline font-medium">Revoke</button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!qrModal} onClose={() => setQrModal(null)} title="Emergency QR Code">
        {qrModal && (
          <div className="text-center">
            <p className="text-xs text-warning font-medium mb-4">Valid 15 min · One-time use · Scan now</p>
            <div className="flex justify-center mb-4">
              <img src={`data:image/png;base64,${qrModal.qr_code_base64}`} alt="Emergency QR code"
                className="w-52 h-52 border border-border rounded-lg" />
            </div>
            <p className="text-xs text-muted break-all mb-4">{qrModal.emergency_url}</p>
            <div className="flex gap-3">
              <button onClick={downloadQR} className="flex-1 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Download PNG
              </button>
              <button onClick={() => setQrModal(null)} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted hover:bg-bg">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}