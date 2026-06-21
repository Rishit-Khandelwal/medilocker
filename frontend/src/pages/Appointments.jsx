import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, MapPin, Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Modal from "../components/ui/Modal.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const STATUS_STYLE = {
  SCHEDULED:   "bg-accent/10 text-accent",
  COMPLETED:   "bg-success/10 text-success",
  CANCELLED:   "bg-danger/10 text-danger",
  RESCHEDULED: "bg-warning/10 text-warning",
};
const STATUS_ICON = { SCHEDULED: Clock, COMPLETED: CheckCircle2, CANCELLED: XCircle, RESCHEDULED: RefreshCw };

const BLANK = { doctor_name: "", doctor_email: "", hospital: "", date: "", notes: "", status: "SCHEDULED" };
const input  = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function Appointments() {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState("upcoming");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(BLANK);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState("");

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get("/timeline/appointments/");
      setAppointments(data.results ?? data);
    } catch { toast("Failed to load appointments.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const now = new Date();
  const filtered = appointments.filter((a) => {
    const d = new Date(a.date);
    if (tab === "upcoming") return d >= now && a.status === "SCHEDULED";
    if (tab === "past")     return d < now || ["COMPLETED","CANCELLED"].includes(a.status);
    return true;
  });

  const openAdd = () => {
    setEditing(null); setForm(BLANK); setFormError(""); setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    const formatted = new Date(a.date).toISOString().slice(0, 16);
    setForm({ doctor_name: a.doctor_name, doctor_email: "", hospital: a.hospital || "", date: formatted, notes: a.notes || "", status: a.status });
    setFormError(""); setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError(""); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.doctor_email) delete payload.doctor_email;

      if (editing) {
        const { data } = await api.patch(`/timeline/appointments/${editing.id}/`, payload);
        setAppointments((prev) => prev.map((a) => (a.id === data.id ? data : a)));
        toast("Appointment updated.", "success");
      } else {
        const { data } = await api.post("/timeline/appointments/", payload);
        setAppointments((prev) => [data, ...prev]);
        toast("Appointment added.", "success");
      }
      setModalOpen(false);
    } catch (err) {
      const d = err.response?.data;
      setFormError(d ? Object.values(d).flat().join(" ") : "Save failed.");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this appointment?")) return;
    try {
      await api.delete(`/timeline/appointments/${id}/`);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast("Appointment deleted.", "success");
    } catch { toast("Delete failed.", "error"); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Layout breadcrumb={["Appointments"]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Appointments</h1>
          <p className="text-sm text-muted mt-0.5">{appointments.length} total</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex gap-1 mb-5 border-b border-border">
        {[{ key: "upcoming", label: "Upcoming" }, { key: "past", label: "Past" }, { key: "all", label: "All" }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-accent text-accent" : "border-transparent text-muted hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-accent animate-spin" /></div>}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Calendar}
          title={tab === "upcoming" ? "No upcoming appointments" : "No appointments found"}
          description={tab === "upcoming" ? "Schedule your next appointment to track it here." : ""}
          action={tab === "upcoming" && (
            <button onClick={openAdd} className="text-sm text-accent hover:underline font-medium">Add appointment</button>
          )} />
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((a) => {
            const d         = new Date(a.date);
            const StatusIcon = STATUS_ICON[a.status] || Clock;
            return (
              <Card key={a.id} className="flex items-start justify-between gap-4">
                <div className="flex gap-3 items-start min-w-0">
                  <div className="w-10 text-center flex-shrink-0 pt-0.5">
                    <p className="text-lg font-semibold text-foreground leading-none">{d.getDate()}</p>
                    <p className="text-[11px] text-muted">{d.toLocaleDateString("en-IN", { month: "short" })}</p>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">Dr. {a.doctor_name}</p>
                      {a.doctor_linked && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded border border-success/20">verified</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${STATUS_STYLE[a.status] || "bg-bg text-muted"}`}>
                        <StatusIcon className="w-3 h-3" />
                        {a.status_display}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      {a.hospital && (
                        <span className="text-xs text-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {a.hospital}
                        </span>
                      )}
                      <span className="text-xs text-muted">
                        {d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {a.notes && <p className="text-xs text-muted mt-1 line-clamp-1">{a.notes}</p>}
                  </div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => openEdit(a)} className="text-xs text-accent hover:underline font-medium">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-danger hover:underline font-medium">Delete</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Appointment" : "New Appointment"}>
        {formError && <p className="text-danger text-sm mb-3">{formError}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Doctor name *</label>
            <input required value={form.doctor_name} onChange={set("doctor_name")} className={input} placeholder="Dr. Sharma" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Doctor's MediLocker email</label>
            <input type="email" value={form.doctor_email} onChange={set("doctor_email")} className={input} placeholder="doctor@hospital.com (optional)" />
            <p className="text-[11px] text-muted mt-1">If the doctor is registered in MediLocker, entering their email links this appointment to their dashboard.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Hospital / Clinic</label>
            <input value={form.hospital} onChange={set("hospital")} className={input} placeholder="City Hospital" />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Date &amp; Time *</label>
            <input required type="datetime-local" value={form.date} onChange={set("date")} className={input} />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Notes</label>
            <textarea rows={3} value={form.notes} onChange={set("notes")} className={input} placeholder="Reason for visit, symptoms..." />
          </div>
          {editing && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Status</label>
              <select value={form.status} onChange={set("status")} className={input}>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Update" : "Add Appointment"}
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