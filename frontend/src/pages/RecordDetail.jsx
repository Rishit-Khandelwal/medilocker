import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";

const CATEGORIES = [
  { value: "lab_report", label: "Lab Report" }, { value: "prescription", label: "Prescription" },
  { value: "mri", label: "MRI Scan" }, { value: "ct_scan", label: "CT Scan" },
  { value: "xray", label: "X-Ray" }, { value: "vaccination", label: "Vaccination Record" },
  { value: "other", label: "Other" },
];

const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

export default function RecordDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const blobUrl    = useRef(null);

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

        // Fetch file as blob for authenticated preview
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

    // Cleanup blob URL on unmount
    return () => { if (blobUrl.current) URL.revokeObjectURL(blobUrl.current); };
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/records/${id}/`, editForm);
      setRecord(data);
      setEditing(false);
    } catch {
      alert("Update failed.");
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
      alert("Delete failed.");
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
    <Layout>
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <p className="text-red-600 text-sm">{error}</p>
      <Link to="/records" className="text-primary-600 text-sm mt-2 inline-block">← Back to Records</Link>
    </Layout>
  );

  const isPdf = record.mime_type === "application/pdf";
  const isImg = record.mime_type.startsWith("image/");

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/records" className="hover:text-gray-700">Records</Link>
        <span>›</span>
        <span className="text-gray-900 font-medium truncate">{record.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{record.original_filename}</span>
              <button onClick={handleDownload}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                ↓ Download
              </button>
            </div>
            <div className="bg-gray-50 min-h-[400px] flex items-center justify-center">
              {fileUrl && isPdf && (
                <iframe src={fileUrl} className="w-full h-[500px]" title={record.title} />
              )}
              {fileUrl && isImg && (
                <img src={fileUrl} alt={record.title}
                  className="max-w-full max-h-[500px] object-contain p-4" />
              )}
              {!fileUrl && (
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-sm">Loading preview…</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              {!editing && (
                <button onClick={() => setEditing(true)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium">Edit</button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                  <input className={inputClass} value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select className={inputClass} value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                    {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea rows={3} className={inputClass} value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
                  <input className={inputClass} value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50">
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
                    <dt className="text-xs text-gray-400 mb-1">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {record.tags_list.map((t) => (
                        <span key={t} className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">{t}</span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          <button onClick={handleDelete}
            className="w-full py-2.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors">
            Delete record
          </button>
        </div>
      </div>
    </Layout>
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