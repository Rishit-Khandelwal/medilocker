import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const STATUS_CONFIG = {
  PENDING: {
    icon:  "⏳",
    colour: "amber",
    title:  "Verification pending",
    body:   "Your document has been received. Our team will review your submission shortly. You're logged in as a Patient in the meantime.",
  },
  APPROVED: {
    icon:  "✅",
    colour: "green",
    title:  "Verification approved!",
    body:   "Your professional credentials have been verified. Your role has been updated — please log in again to access all features.",
  },
  REJECTED: {
    icon:  "❌",
    colour: "red",
    title:  "Verification rejected",
    body:   "Unfortunately your submission was not approved. Please review the notes below and contact support if you have questions.",
  },
};

const COLOUR = {
  amber: { bg: "bg-amber-50",  border: "border-amber-200", text: "text-amber-800" },
  green: { bg: "bg-green-50",  border: "border-green-200", text: "text-green-800" },
  red:   { bg: "bg-red-50",    border: "border-red-200",   text: "text-red-800"   },
};

export default function PendingVerification() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/auth/verification-status/")
      .then(({ data }) => setRequest(data))
      .catch((err) => {
        if (err.response?.status === 404) {
          // No pending request — send to dashboard
          navigate("/dashboard", { replace: true });
        } else {
          setError("Failed to fetch verification status.");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleGoToDashboard = () => navigate("/dashboard");

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
    </div>
  );

  const cfg    = STATUS_CONFIG[request?.status] || STATUS_CONFIG.PENDING;
  const clr    = COLOUR[cfg.colour];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">M</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">{cfg.icon}</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{cfg.title}</h1>

          {/* Status banner */}
          <div className={`${clr.bg} ${clr.border} ${clr.text} border rounded-lg p-4 text-sm mb-5 text-left`}>
            <p>{cfg.body}</p>
          </div>

          {/* Request details */}
          {request && (
            <div className="text-left space-y-2 text-sm text-gray-600 mb-5">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Requested role</span>
                <span className="font-medium text-gray-900">{request.requested_role}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-400">Submitted</span>
                <span>{new Date(request.submitted_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric"
                })}</span>
              </div>
              {request.reviewed_at && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-400">Reviewed</span>
                  <span>{new Date(request.reviewed_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })}</span>
                </div>
              )}
              {request.reviewer_notes && (
                <div className="pt-1">
                  <p className="text-gray-400 mb-1">Reviewer notes</p>
                  <p className="bg-gray-50 rounded-lg p-3 text-gray-700 text-xs leading-relaxed">
                    {request.reviewer_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button onClick={handleGoToDashboard}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
              Continue as Patient
            </button>
            <button onClick={handleLogout}
              className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Sign out
            </button>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            Logged in as <strong>{user?.email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}