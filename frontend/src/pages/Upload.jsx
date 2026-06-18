import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, UploadCloud, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";

const CATEGORIES = [
  { value: "lab_report",   label: "Lab Report" },
  { value: "prescription", label: "Prescription" },
  { value: "mri",          label: "MRI Scan" },
  { value: "ct_scan",      label: "CT Scan" },
  { value: "xray",         label: "X-Ray" },
  { value: "vaccination",  label: "Vaccination Record" },
  { value: "other",        label: "Other" },
];

const ACCEPTED = ".pdf,.png,.jpeg,.jpg";
const input = "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

export default function Upload() {
  const [file, setFile]         = useState(null);
  const [form, setForm]         = useState({ title: "", category: "other", description: "", tags: "" });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);
  const navigate  = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    if (!form.title) setForm((f) => ({ ...f, title: selected.name.replace(/\.[^.]+$/, "") }));
    setError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a file."); return; }
    setError("");
    setLoading(true);
    setProgress(0);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", form.title);
    fd.append("category", form.category);
    fd.append("description", form.description);
    fd.append("tags", form.tags);

    try {
      await api.post("/records/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      });
      navigate("/records");
    } catch (err) {
      const d = err.response?.data;
      if (d?.file) setError(Array.isArray(d.file) ? d.file[0] : d.file);
      else if (d?.non_field_errors) setError(d.non_field_errors[0]);
      else setError("Upload failed. Check file type and size (max 20 MB).");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout breadcrumb={["Records", "Upload"]}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/records" className="text-muted hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
          <h1 className="text-xl font-semibold text-foreground">Upload Record</h1>
        </div>

        <Card as="form" onSubmit={submit} className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging ? "border-accent bg-accent/5" : file ? "border-success bg-success/5" : "border-border hover:border-muted"
            }`}>
            <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])} />
            {file ? (
              <div>
                <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="font-medium text-foreground text-sm">{file.name}</p>
                <p className="text-xs text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-7 h-7 text-muted mx-auto mb-1" />
                <p className="font-medium text-foreground text-sm">Drag &amp; drop or <span className="text-accent">browse</span></p>
                <p className="text-xs text-muted">PDF, PNG, JPEG · Max 20 MB</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title <span className="text-danger">*</span></label>
            <input type="text" required value={form.title} onChange={set("title")} className={input} />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <select value={form.category} onChange={set("category")} className={input}>
              {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={set("description")} className={input}
              placeholder="Optional notes about this record" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={set("tags")} className={input}
              placeholder="e.g. blood test, 2026, dr. sharma" />
            <p className="text-xs text-muted mt-1">Comma-separated — used for search in Phase 7</p>
          </div>

          {error && <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>}

          {loading && (
            <div className="space-y-1">
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted text-center">{progress}%</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !file}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Uploading…" : "Upload Record"}
            </button>
            <Link to="/records" className="px-4 py-2.5 rounded-lg border border-border text-sm text-muted hover:bg-bg transition-colors">
              Cancel
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}