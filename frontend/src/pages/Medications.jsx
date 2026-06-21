import { useState, useEffect, useCallback } from "react";
import { Plus, Pill, Loader2 } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const BLANK = { medicine: "", dose: "", frequency: "", start_date: "", end_date: "", notes: "", is_active: true };
const input  = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function Medications() {
  const { toast } = useToast();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("active");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/timeline/medications/");
      setMedications(data.results ?? data);
    } catch { toast("Failed to load medications.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = tab === "active"
    ? medications.filter((m) => m.is_active)
    : medications;

  const openAdd = () => {
    setEditing(null); setForm(BLANK); setFormError(""); setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      medicine:   m.medicine,
      dose:       m.dose,
      frequency:  m.frequency,
      start_date: m.start_date || "",
      end_date:   m.end_date   || "",
      notes:      m.notes      || "",
      is_active:  m.is_active,
    });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      const payload = { ...form, end_date: form.end_date || null };

      if (editing) {
        const { data } = await api.patch(`/timeline/medications/${editing.id}/`, payload);
        setMedications((prev) => prev.map((m) => (m.id === data.id ? data : m)));
        toast("Medication updated.", "success");
      } else {
        const { data } = await api.post("/timeline/medications/", payload);
        setMedications((prev) => [data, ...prev]);
        toast("Medication added.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      const d = err.response?.data;
      setFormError(d ? Object.values(d).flat().join(" ") : "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await api.delete(`/timeline/medications/${id}/`);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      toast("Medication removed.", "success");
    } catch { toast("Delete failed.", "error"); }
  };

  const set     = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setCheck = (k) => (e) => setForm({ ...form, [k]: e.target.checked });

  return (
    <Layout breadcrumb={["Medications"]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Medications</h1>
          <p className="text-sm text-muted mt-0.5">{medications.length} total · {medications.filter((m) => m.is_active).length} active</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        {[{ key: "active", label: "Active" }, { key: "all", label: "All" }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Pill}
          title={tab === "active" ? "No active medications" : "No medications recorded"}
          description="Add your current medications to track them here."
          action={<button onClick={openAdd} className="text-sm text-accent hover:underline font-medium">Add medication</button>} />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{m.medicine}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${m.is_active ? "bg-success/10 text-success" : "bg-bg text-muted border border-border"}`}>
                  {m.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <dl className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <dt className="text-muted">Dose</dt>
                  <dd className="text-foreground font-medium">{m.dose}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Frequency</dt>
                  <dd className="text-foreground">{m.frequency}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Started</dt>
                  <dd className="text-foreground">{m.start_date ? new Date(m.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</dd>
                </div>
                {m.end_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Until</dt>
                    <dd className="text-foreground">{new Date(m.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</dd>
                  </div>
                )}
                {m.prescribed_by_name && (
                  <div className="flex justify-between">
                    <dt className="text-muted">Prescribed by</dt>
                    <dd className="text-foreground">{m.prescribed_by_name}</dd>
                  </div>
                )}
              </dl>

              {m.notes && <p className="text-xs text-muted mb-3 line-clamp-2">{m.notes}</p>}

              <div className="flex gap-3 pt-2 border-t border-border">
                <button onClick={() => openEdit(m)} className="text-xs text-accent hover:underline font-medium">Edit</button>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-danger hover:underline font-medium">Delete</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Medication" : "New Medication"}>
        {formError && <p className="text-danger text-sm mb-3">{formError}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Medicine name *</label>
            <input required value={form.medicine} onChange={set("medicine")} className={input} placeholder="e.g. Metformin" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Dose *</label>
              <input required value={form.dose} onChange={set("dose")} className={input} placeholder="500mg" />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Frequency *</label>
              <input required value={form.frequency} onChange={set("frequency")} className={input} placeholder="Twice daily" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Start date *</label>
              <input required type="date" value={form.start_date} onChange={set("start_date")} className={input} />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">End date</label>
              <input type="date" value={form.end_date} onChange={set("end_date")} className={input} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
            <textarea rows={2} value={form.notes} onChange={set("notes")} className={input} placeholder="Take with food, etc." />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={setCheck("is_active")} className="accent-accent" />
            <label htmlFor="is_active" className="text-sm text-foreground">Currently taking this medication</label>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Add Medication"}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-2.5 border border-border text-sm text-muted rounded-lg hover:bg-bg">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}