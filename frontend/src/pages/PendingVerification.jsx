import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    title: "Verification pending",
    body: "Your document has been received. Our team will review your submission shortly. You're logged in as a Patient in the meantime.",
    iconBg: "bg-warning/10", iconColor: "text-warning",
    bannerBg: "bg-warning/10", bannerBorder: "border-warning/20", bannerText: "text-warning",
  },
  APPROVED: {
    icon: CheckCircle2,
    title: "Verification approved",
    body: "Your professional credentials have been verified. Your role has been updated — please log in again to access all features.",
    iconBg: "bg-success/10", iconColor: "text-success",
    bannerBg: "bg-success/10", bannerBorder: "border-success/20", bannerText: "text-success",
  },
  REJECTED: {
    icon: XCircle,
    title: "Verification rejected",
    body: "Unfortunately your submission was not approved. Please review the notes below and contact support if you have questions.",
    iconBg: "bg-danger/10", iconColor: "text-danger",
    bannerBg: "bg-danger/10", bannerBorder: "border-danger/20", bannerText: "text-danger",
  },
};

export default function PendingVerification() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/auth/verification-status/")
      .then(({ data }) => setRequest(data))
      .catch((err) => {
        if (err.response?.status === 404) navigate("/dashboard", { replace: true });
        else setError("Failed to fetch verification status.");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => { await logout(); navigate("/login"); };

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );

  const cfg  = STATUS_CONFIG[request?.status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl shadow-sm p-8 text-center">
          <div className={`w-11 h-11 rounded-full ${cfg.iconBg} flex items-center justify-center mx-auto mb-4`}>
            <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{cfg.title}</h1>

          <div className={`${cfg.bannerBg} border ${cfg.bannerBorder} ${cfg.bannerText} rounded-lg p-4 text-sm mb-5 text-left`}>
            <p>{cfg.body}</p>
          </div>

          {request && (
            <div className="text-left space-y-2 text-sm text-muted mb-5">
              <div className="flex justify-between border-b border-border pb-2">
                <span>Requested role</span>
                <span className="font-medium text-foreground">{request.requested_role}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span>Submitted</span>
                <span>{new Date(request.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              {request.reviewed_at && (
                <div className="flex justify-between border-b border-border pb-2">
                  <span>Reviewed</span>
                  <span>{new Date(request.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              )}
              {request.reviewer_notes && (
                <div className="pt-1">
                  <p className="mb-1">Reviewer notes</p>
                  <p className="bg-bg rounded-lg p-3 text-foreground text-xs leading-relaxed">{request.reviewer_notes}</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-danger text-sm mb-4">{error}</p>}

          <div className="flex flex-col gap-3">
            <button onClick={() => navigate("/dashboard")}
              className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors">
              Continue as Patient
            </button>
            <button onClick={handleLogout}
              className="w-full py-2.5 rounded-lg border border-border text-muted text-sm font-medium hover:bg-bg transition-colors">
              Sign out
            </button>
          </div>

          <p className="mt-5 text-xs text-muted">Logged in as <strong className="text-foreground">{user?.email}</strong></p>
        </div>
      </div>
    </div>
  );
}