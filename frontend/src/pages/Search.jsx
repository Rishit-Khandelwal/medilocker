import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon, Loader2, FileText, RotateCcw } from "lucide-react";
import api from "../api/axios";
import Layout from "../components/Layout.jsx";
import Card from "../components/ui/Card.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const CATEGORY_DISPLAY = {
  lab_report:   "Lab Report",
  prescription: "Prescription",
  mri:          "MRI Scan",
  ct_scan:      "CT Scan",
  xray:         "X-Ray",
  vaccination:  "Vaccination",
  other:        "Other",
};

function ScoreBar({ score }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="w-16 h-1 rounded-full bg-bg overflow-hidden">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(score * 100)}%` }} />
      </div>
      <span className="text-[10px] text-muted tabular-nums">{Math.round(score * 100)}%</span>
    </div>
  );
}

export default function Search() {
  const [input,    setInput]    = useState("");
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [error,    setError]    = useState("");

  const handleSearch = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setQuery(q);
    try {
      const { data } = await api.get("/search/", { params: { q, limit: 8 } });
      setResults(data.results || []);
      setSearched(true);
      if (data.error) setError(data.error);
    } catch {
      setError("Search is unavailable. Make sure Qdrant is running and at least one document has been processed.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async (recordId) => {
    try {
      await api.post(`/search/reindex/${recordId}/`);
      alert("Reindex queued. Check back in a few minutes.");
    } catch {
      alert("Reindex failed.");
    }
  };

  return (
    <Layout breadcrumb={["Semantic Search"]}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Semantic Search</h1>
          <p className="text-sm text-muted mt-0.5">
            Search the contents of your medical records using natural language — powered by local embeddings, no cloud required.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <SearchIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try "creatinine level", "prescribed antibiotic", "blood sugar report"…'
                className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              />
            </div>
            <button type="submit" disabled={loading || !input.trim()}
              className="px-5 py-3 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0">
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <SearchIcon className="w-4 h-4" />}
              Search
            </button>
          </div>
          <p className="text-xs text-muted mt-2">
            Results rank by meaning, not keywords. Newly uploaded documents are indexed automatically — usually within 1–2 minutes.
          </p>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Empty result */}
        {searched && !loading && results.length === 0 && !error && (
          <EmptyState icon={SearchIcon}
            title="No results found"
            description={`Nothing matched "${query}". Try different phrasing, or wait a few minutes for newly uploaded documents to finish processing.`} />
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-muted">
              {results.length} result{results.length !== 1 ? "s" : ""} for
              <span className="text-foreground font-medium"> "{query}"</span>
            </p>

            {results.map((r, i) => (
              <Card key={i} className="hover:border-accent/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link to={`/records/${r.record_id}`}
                      className="text-sm font-medium text-accent hover:underline truncate block">
                      {r.record_title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-bg border border-border text-muted rounded capitalize">
                        {CATEGORY_DISPLAY[r.category] || r.category}
                      </span>
                      <ScoreBar score={r.score} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => handleReindex(r.record_id)}
                      className="text-muted hover:text-foreground transition-colors" title="Re-run OCR and reindex">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <Link to={`/records/${r.record_id}`}
                      className="text-xs text-accent hover:underline font-medium">
                      Open →
                    </Link>
                  </div>
                </div>

                <div className="bg-bg rounded-lg p-3 border border-border">
                  <p className="text-xs text-foreground leading-relaxed font-mono whitespace-pre-wrap line-clamp-5">
                    {r.chunk_text}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pre-search landing */}
        {!searched && !loading && (
          <div className="text-center py-14">
            <div className="w-12 h-12 rounded-full bg-bg border border-border flex items-center justify-center mx-auto mb-4">
              <FileText className="w-5 h-5 text-muted" />
            </div>
            <p className="text-sm font-medium text-foreground">Search inside your records</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
              Ask natural language questions like<br />
              "What was my creatinine level?" or<br />
              "Which antibiotic was I prescribed in 2025?"
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "creatinine values",
                "blood sugar level",
                "prescribed antibiotic",
                "MRI findings",
                "allergy test results",
              ].map((ex) => (
                <button key={ex} onClick={() => { setInput(ex); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-muted hover:text-foreground hover:border-accent/40 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}