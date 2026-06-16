import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Image as ImageIcon, File, Plus, FileQuestion } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const CATEGORIES = [
  { value: "",             label: "All" },
  { value: "lab_report",   label: "Lab Reports" },
  { value: "prescription", label: "Prescriptions" },
  { value: "mri",          label: "MRI" },
  { value: "ct_scan",      label: "CT Scan" },
  { value: "xray",         label: "X-Ray" },
  { value: "vaccination",  label: "Vaccination" },
  { value: "other",        label: "Other" },
];

const TYPE_ICON = {
  "application/pdf": FileText,
  "image/png":       ImageIcon,
  "image/jpeg":      ImageIcon,
};

export default function Records() {
  const [params]               = useSearchParams();
  const { toast }               = useToast();
  const [records, setRecords]  = useState([]);
  const [total, setTotal]      = useState(0);
  const [loading, setLoading]  = useState(true);
  const [error, setError]      = useState("");
  const [search, setSearch]    = useState(params.get("search") || "");
  const [category, setCategory] = useState("");
  const [query, setQuery]      = useState(params.get("search") || "");

  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = {};
      if (query)    p.search   = query;
      if (category) p.category = category;
      const { data } = await api.get("/records/", { params: p });
      setRecords(data.results ?? data);
      setTotal(data.count ?? (data.results ?? data).length);
    } catch {
      setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [query, category]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record? This cannot be undone.")) return;
    try {
      await api.delete(`/records/${id}/`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotal((n) => n - 1);
      toast("Record deleted.", "success");
    } catch {
      toast("Delete failed.", "error");
    }
  };

  return (
    <Layout breadcrumb={["Records"]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Medical Records</h1>
          <p className="text-sm text-muted mt-0.5">{total} record{total !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/records/upload"
          className="flex items-center gap-1.5 px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors">
          <Plus className="w-4 h-4" /> Upload
        </Link>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search by title, description or tags…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ value, label }) => (
          <button key={value} onClick={() => setCategory(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === value ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:border-accent/40"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {!loading && records.length === 0 && (
        <EmptyState icon={FileQuestion}
          title="No records found"
          description={search || category ? "Try a different filter." : "Upload your first medical record to get started."}
          action={!search && !category && (
            <Link to="/records/upload" className="text-sm text-accent hover:underline font-medium">Upload your first report</Link>
          )} />
      )}

      {!loading && records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <RecordCard key={record.id} record={record} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </Layout>
  );
}

function RecordCard({ record, onDelete }) {
  const Icon = TYPE_ICON[record.mime_type] || File;
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-bg flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-muted" />
          </div>
          <Link to={`/records/${record.id}`} className="text-sm font-medium text-foreground hover:text-accent truncate">
            {record.title}
          </Link>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bg border border-border text-muted flex-shrink-0 capitalize">
          {record.category_display}
        </span>
      </div>

      {record.description && <p className="text-xs text-muted line-clamp-2">{record.description}</p>}

      {record.tags_list?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.tags_list.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-accent/10 text-accent rounded">{tag}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <span className="text-xs text-muted">{record.file_size_display} · v{record.version}</span>
        <div className="flex items-center gap-3">
          <Link to={`/records/${record.id}`} className="text-xs text-accent hover:underline font-medium">View</Link>
          <button onClick={() => onDelete(record.id)} className="text-xs text-danger hover:underline font-medium">Delete</button>
        </div>
      </div>
    </div>
  );
}