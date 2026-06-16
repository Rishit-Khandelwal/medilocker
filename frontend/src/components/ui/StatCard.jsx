import { Link } from "react-router-dom";
import Card from "./Card.jsx";

export default function StatCard({ icon: Icon, label, value, to, loading, accent = false }) {
  const content = (
    <Card className={`flex items-center justify-between transition-colors ${to ? "hover:border-accent/40 cursor-pointer" : ""}`}>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">
          {loading ? <span className="skeleton inline-block w-10 h-6 rounded" /> : value}
        </p>
      </div>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent ? "bg-accent/10 text-accent" : "bg-bg text-muted"}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
    </Card>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}