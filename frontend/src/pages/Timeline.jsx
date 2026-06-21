import { useState, useEffect } from "react";
import { Calendar, FileText, Pill, History } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";

const TYPE_CONFIG = {
  record:      { icon: FileText, label: "Record" },
  appointment: { icon: Calendar, label: "Appointment" },
  medication:  { icon: Pill,     label: "Medication" },
};

function groupByMonth(items) {
  const groups = {};
  items.forEach((item) => {
    if (!item.date) return;
    const d   = new Date(item.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const lbl = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!groups[key]) groups[key] = { label: lbl, items: [] };
    groups[key].items.push(item);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export default function Timeline() {
  const [items, setItems]     = useState([]);
  const [filter, setFilter]   = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/timeline/feed/")
      .then(({ data }) => setItems(data))
      .catch(() => setError("Failed to load timeline."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const groups   = groupByMonth(filtered);

  return (
    <Layout breadcrumb={["Timeline"]}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Health Timeline</h1>
        <p className="text-sm text-muted mt-0.5">Your complete health history in chronological order</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all",         label: "All" },
          { key: "record",      label: "Records" },
          { key: "appointment", label: "Appointments" },
          { key: "medication",  label: "Medications" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === key ? "bg-accent text-white" : "bg-surface border border-border text-muted hover:border-accent/40"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3 ml-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && <p className="text-danger text-sm">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon={History} title="No entries yet"
          description="Your records, appointments, and medications will all appear here in chronological order." />
      )}

      {!loading && groups.length > 0 && (
        <div className="relative">
          <div className="absolute left-3.5 top-8 bottom-2 w-px bg-border" />
          <div className="space-y-8">
            {groups.map(([key, group]) => (
              <div key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center z-10 flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </div>
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">{group.label}</h3>
                </div>

                <div className="ml-10 space-y-2.5">
                  {group.items.map((item) => {
                    const { icon: Icon, label } = TYPE_CONFIG[item.type] || TYPE_CONFIG.record;
                    const d = item.date ? new Date(item.date) : null;
                    return (
                      <div key={`${item.type}-${item.id}`}
                        className="bg-surface border border-border rounded-xl p-3.5 flex items-start gap-3 hover:border-accent/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.title}</p>
                              {item.subtitle && <p className="text-xs text-muted mt-0.5">{item.subtitle}</p>}
                            </div>
                            <span className="text-xs text-muted flex-shrink-0">
                              {d ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                            </span>
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-bg border border-border text-muted rounded">{label}</span>
                            {item.meta?.status && item.meta.status !== "SCHEDULED" && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-bg border border-border text-muted rounded capitalize">
                                {item.meta.status.toLowerCase()}
                              </span>
                            )}
                            {item.meta?.is_active === "False" && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-bg border border-border text-muted rounded">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}