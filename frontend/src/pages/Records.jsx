import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";

const CATEGORIES = [
  { value: "",            label: "All" },
  { value: "lab_report",  label: "Lab Reports" },
  { value: "prescription",label: "Prescriptions" },
  { value: "mri",         label: "MRI" },
  { value: "ct_scan",     label: "CT Scan" },
  { value: "xray",        label: "X-Ray" },
  { value: "vaccination", label: "Vaccination" },
  { value: "other",       label: "Other" },
];

const TYPE_ICON = {
  "application/pdf": "📄",
  "image/png":       "🖼️",
  "image/jpeg":      "🖼️",
};

export default function Records() {
  const [records, setRecords]   = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery]       = useState("");   // debounced search

  // Debounce search input by 400ms
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (query)    params.search   = query;
      if (category) params.category = category;
      const { data } = await api.get("/records/", { params });
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
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} record{total !== 1 ? "s" : ""}</p>
        </div>
        <Link to="/records/upload"
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          + Upload
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="Search by title, description or tags…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500" />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(({ value, label }) => (
          <button key={value} onClick={() => setCategory(value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === value
                ? "bg-primary-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary-400"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* States */}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && records.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📁</div>
          <p className="font-medium text-gray-500">No records found</p>
          <p className="text-sm mt-1">
            {search || category ? "Try a different filter" : "Upload your first medical record"}
          </p>
        </div>
      )}

      {/* Grid */}
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
  const icon = TYPE_ICON[record.mime_type] || "📎";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 hover:border-primary-300 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">{icon}</span>
          <Link to={`/records/${record.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-primary-600 truncate">
            {record.title}
          </Link>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0 capitalize">
          {record.category_display}
        </span>
      </div>

      {record.description && (
        <p className="text-xs text-gray-500 line-clamp-2">{record.description}</p>
      )}

      {record.tags_list?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {record.tags_list.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {record.file_size_display} · v{record.version}
        </span>
        <div className="flex items-center gap-3">
          <Link to={`/records/${record.id}`}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium">View</Link>
          <button onClick={() => onDelete(record.id)}
            className="text-xs text-red-400 hover:text-red-600 font-medium">Delete</button>
        </div>
      </div>
    </div>
  );
}