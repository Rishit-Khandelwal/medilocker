import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

const ROLE_OPTIONS = [
  {
    value: "PATIENT",
    label: "Patient",
    description: "Personal health record management",
    icon: "👤",
  },
  {
    value: "DOCTOR",
    label: "Doctor / Physician",
    description: "Requires identity verification (license / hospital ID)",
    icon: "🩺",
  },
  {
    value: "RESPONDER",
    label: "Emergency Responder",
    description: "Requires identity verification (certificate / service ID)",
    icon: "🚑",
  },
];

const ACCEPTED_DOCS = ".pdf,.png,.jpg,.jpeg";

export default function Register() {
  const [form, setForm] = useState({
    email: "", username: "", first_name: "", last_name: "",
    password: "", password2: "", role: "PATIENT",
  });
  const [docFile, setDocFile]   = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const needsDoc = ["DOCTOR", "RESPONDER"].includes(form.role);

  const handleFileSelect = (file) => {
    if (!file) return;
    setDocFile(file);
    setError("");
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.password2) {
      setError("Passwords don't match.");
      return;
    }
    if (needsDoc && !docFile) {
      setError("Please upload your professional proof document.");
      return;
    }

    setLoading(true);
    try {
      let payload;

      if (needsDoc) {
        // Must be FormData so the file is sent as multipart
        payload = new FormData();
        Object.entries(form).forEach(([k, v]) => payload.append(k, v));
        payload.append("document", docFile);
      } else {
        payload = form;
      }

      const result = await register(payload);

      if (result.needs_verification) {
        navigate("/pending-verification");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const d = err.response?.data;
      if (d) {
        const key = Object.keys(d)[0];
        setError(Array.isArray(d[key]) ? d[key][0] : String(d[key]));
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-lg">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-900">Create account</h1>
        <p className="mt-1 text-center text-sm text-gray-500">MediLocker — your health vault</p>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">

            {/* ── Role selection ───────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am registering as
              </label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map(({ value, label, description, icon }) => (
                  <label key={value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.role === value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}>
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={form.role === value}
                      onChange={set("role")}
                      className="mt-0.5 accent-primary-600"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Name row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input type="text" value={form.first_name} onChange={set("first_name")} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input type="text" value={form.last_name} onChange={set("last_name")} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" required value={form.username} onChange={set("username")} className={input} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={form.email} onChange={set("email")} className={input} placeholder="you@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-gray-400 font-normal">(min 8 chars)</span>
              </label>
              <input type="password" required value={form.password} onChange={set("password")} className={input} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" required value={form.password2} onChange={set("password2")} className={input} />
            </div>

            {/* ── Document upload — shown only for DOCTOR / RESPONDER ─── */}
            {needsDoc && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professional proof document <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload a license, hospital ID, or professional certificate (PDF, PNG, JPG · max 10 MB).
                  Your account will be active as a Patient until our team verifies your document.
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragging
                      ? "border-primary-500 bg-primary-50"
                      : docFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                  }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_DOCS}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                  />
                  {docFile ? (
                    <div>
                      <div className="text-2xl mb-1">✅</div>
                      <p className="text-sm font-medium text-gray-800">{docFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(docFile.size / 1024 / 1024).toFixed(2)} MB · Click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">📎</div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag &amp; drop or <span className="text-primary-600">browse</span>
                      </p>
                      <p className="text-xs text-gray-400">PDF, PNG, JPG · max 10 MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Submit ───────────────────────────────────────────────── */}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading
                ? "Creating account…"
                : needsDoc
                ? "Submit for verification"
                : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already registered?{" "}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}