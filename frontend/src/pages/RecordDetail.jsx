import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Trash2 } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const CATEGORIES = [
  { value: "lab_report", label: "Lab Report" }, { value: "prescription", label: "Prescription" },
  { value: "mri", label: "MRI Scan" }, { value: "ct_scan", label: "CT Scan" },
  { value: "xray", label: "X-Ray" }, { value: "vaccination", label: "Vaccination Record" },
  { value: "other", label: "Other" },
];

const input = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function RecordDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const blobUrl  = useRef(null);

  const [record, setRecord]     = useState(null);
  const [fileUrl, setFileUrl]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/records/${id}/`);
        setRecord(data);
        setEditForm({ title: data.title, category: data.category, description: data.description, tags: data.tags });

        const res = await api.get(`/records/${id}/download/`, { responseType: "blob" });
        const url = URL.createObjectURL(res.data);
        blobUrl.current = url;
        setFileUrl(url);
      } catch {
        setError("Record not found or you don't have access.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); };
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/records/${id}/`, editForm);
      setRecord(data);
      setEditing(false);
      toast("Record updated.", "success");
    } catch {
      toast("Update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Permanently delete this record?")) return;
    try {
      await api.delete(`/records/${id}/`);
      navigate("/records");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  const handleDownload = () => {
    if (!fileUrl || !record) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = record.original_filename;
    a.click();
  };

  if (loading) return (
    <Layout breadcrumb={["Records"]}>
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout breadcrumb={["Records"]}>
      <p className="text-danger text-sm">{error}</p>
      <Link to="/records" className="text-accent text-sm mt-2 inline-block hover:underline">← Back to Records</Link>
    </Layout>
  );

  const isPdf = record.mime_type === "application/pdf";
  const isImg = record.mime_type.startsWith("image/");

  return (
    <Layout breadcrumb={["Records", record.title]}>
      <div className="flex items-center gap-2 mb-6">
        <Link to="/records" className="text-muted hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
        <span className="text-sm font-medium text-foreground truncate">{record.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground truncate">{record.original_filename}</span>
              <button onClick={handleDownload} className="flex items-center gap-1.5 text-sm text-accent hover:underline font-medium flex-shrink-0">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
            <div className="bg-bg min-h-[400px] flex items-center justify-center">
              {fileUrl && isPdf && <iframe src={fileUrl} className="w-full h-[500px]" title={record.title} />}
              {fileUrl && isImg && <img src={fileUrl} alt={record.title} className="max-w-full max-h-[500px] object-contain p-4" />}
              {!fileUrl && (
                <div className="text-muted text-center">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Loading preview…</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-foreground text-sm">Details</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-xs text-accent hover:underline font-medium">Edit</button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Title</label>
                  <input className={input} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Category</label>
                  <select className={input} value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Description</label>
                  <textarea rows={3} className={input} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Tags</label>
                  <input className={input} value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent/90 disabled:opacity-50">
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-border text-xs text-muted hover:bg-bg">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <dl className="space-y-3 text-sm">
                <Row label="Category" value={record.category_display} />
                <Row label="File type" value={record.mime_type.split("/")[1].toUpperCase()} />
                <Row label="Size"      value={record.file_size_display} />
                <Row label="Version"   value={`v${record.version}`} />
                <Row label="Uploaded"  value={new Date(record.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
                {record.description && <Row label="Notes" value={record.description} />}
                {record.tags_list?.length > 0 && (
                  <div>
                    <dt className="text-xs text-muted mb-1">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {record.tags_list.map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded">{t}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </Card>

          <button onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-danger/30 text-danger text-sm font-medium hover:bg-danger/5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete record
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-foreground mt-0.5">{value}</dd>
    </div>
  );
}