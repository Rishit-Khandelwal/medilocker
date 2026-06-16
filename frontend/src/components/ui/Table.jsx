import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { SkeletonRow } from "./Skeleton.jsx";

export default function Table({ columns, data, rowKey = "id", onRowClick, loading, emptyState, pageSize = 8 }) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    const copy = [...data];
    copy.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [data, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData  = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(0);
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={col.key}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  className={`text-left px-4 py-2.5 font-medium text-muted text-xs uppercase tracking-wide whitespace-nowrap ${col.sortable ? "cursor-pointer hover:text-foreground" : ""}`}>
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sort.key === col.key &&
                      (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}><td colSpan={columns.length} className="px-4"><SkeletonRow cols={columns.length} /></td></tr>
            ))}
            {!loading && pageData.length === 0 && (
              <tr><td colSpan={columns.length} className="px-4">{emptyState}</td></tr>
            )}
            {!loading && pageData.map((row) => (
              <tr key={row[rowKey]}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-border last:border-0 ${onRowClick ? "cursor-pointer hover:bg-bg" : ""}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && sorted.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted">
          <span>Page {page + 1} of {pageCount}</span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
              className="p-1 rounded-md border border-border disabled:opacity-40 hover:bg-bg">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded-md border border-border disabled:opacity-40 hover:bg-bg">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}