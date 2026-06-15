import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";

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

export default function Upload() {
  const [file, setFile]         = useState(null);
  const [form, setForm]         = useState({ title: "", category: "other", description: "", tags: "" });
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    if (!form.title) {
      // Auto-fill title from filename (strip extension)
      setForm((f) => ({ ...f, title: selected.name.replace(/\.[^.]+$/, "") }));
    }
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
        onUploadProgress: (e) =>
          setProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
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

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

  return (
    <Layout>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/records" className="text-sm text-gray-500 hover:text-gray-700">← Records</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">Upload Record</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-primary-500 bg-primary-50"
                : file
                ? "border-green-400 bg-green-50"
                : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
            }`}>
            <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])} />

            {file ? (
              <div className="space-y-1">
                <div className="text-2xl">✅</div>
                <p className="font-medium text-gray-800 text-sm">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl">📂</div>
                <p className="font-medium text-gray-700 text-sm">
                  Drag &amp; drop or <span className="text-primary-600">browse</span>
                </p>
                <p className="text-xs text-gray-400">PDF, PNG, JPEG · Max 20 MB</p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-400">*</span></label>
            <input type="text" required value={form.title} onChange={set("title")} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={form.category} onChange={set("category")} className={inputClass}>
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={set("description")} className={inputClass}
              placeholder="Optional notes about this record" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={set("tags")} className={inputClass}
              placeholder="e.g. blood test, 2026, dr. sharma" />
            <p className="text-xs text-gray-400 mt-1">Comma-separated — used for search in Phase 7</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          {/* Progress */}
          {loading && (
            <div className="space-y-1">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-500 text-center">{progress}%</p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={loading || !file}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Uploading…" : "Upload Record"}
            </button>
            <Link to="/records"
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
}