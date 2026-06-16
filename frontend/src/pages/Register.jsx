import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Stethoscope, Siren, UploadCloud, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

const input = "w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors";

const ROLE_OPTIONS = [
  { value: "PATIENT",   label: "Patient",            description: "Personal health record management", icon: User },
  { value: "DOCTOR",    label: "Doctor / Physician",  description: "Requires identity verification",     icon: Stethoscope },
  { value: "RESPONDER", label: "Emergency Responder", description: "Requires identity verification",     icon: Siren },
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
    if (form.password !== form.password2) { setError("Passwords don't match."); return; }
    if (needsDoc && !docFile) { setError("Please upload your professional proof document."); return; }

    setLoading(true);
    try {
      let payload;
      if (needsDoc) {
        payload = new FormData();
        Object.entries(form).forEach(([k, v]) => payload.append(k, v));
        payload.append("document", docFile);
      } else {
        payload = form;
      }
      const result = await register(payload);
      navigate(result.needs_verification ? "/pending-verification" : "/dashboard");
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
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
        </div>
        <h1 className="text-center text-xl font-semibold text-foreground">Create account</h1>
        <p className="mt-1 text-center text-sm text-muted">MediLocker — your health vault</p>

        <div className="mt-6 bg-surface border border-border rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">I am registering as</label>
              <div className="space-y-2">
                {ROLE_OPTIONS.map(({ value, label, description, icon: Icon }) => (
                  <label key={value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.role === value ? "border-accent bg-accent/5" : "border-border hover:border-muted"
                    }`}>
                    <input type="radio" name="role" value={value} checked={form.role === value} onChange={set("role")}
                      className="mt-1 accent-accent" />
                    <Icon className="w-4 h-4 mt-0.5 text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">{label}</span>
                      <p className="text-xs text-muted mt-0.5">{description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">First name</label>
                <input type="text" value={form.first_name} onChange={set("first_name")} className={input} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Last name</label>
                <input type="text" value={form.last_name} onChange={set("last_name")} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username</label>
              <input type="text" required value={form.username} onChange={set("username")} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input type="email" required value={form.email} onChange={set("email")} className={input} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password <span className="text-muted font-normal">(min 8 chars)</span>
              </label>
              <input type="password" required value={form.password} onChange={set("password")} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
              <input type="password" required value={form.password2} onChange={set("password2")} className={input} />
            </div>

            {needsDoc && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Professional proof document <span className="text-danger">*</span>
                </label>
                <p className="text-xs text-muted mb-2">
                  License, hospital ID, or certificate (PDF, PNG, JPG · max 10 MB). You'll be active as a Patient until verified.
                </p>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragging ? "border-accent bg-accent/5" : docFile ? "border-success bg-success/5" : "border-border hover:border-muted"
                  }`}>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED_DOCS} className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files[0])} />
                  {docFile ? (
                    <div>
                      <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">{docFile.name}</p>
                      <p className="text-xs text-muted">{(docFile.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="w-6 h-6 text-muted mx-auto mb-1" />
                      <p className="text-sm font-medium text-foreground">Drag &amp; drop or <span className="text-accent">browse</span></p>
                      <p className="text-xs text-muted">PDF, PNG, JPG · max 10 MB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Creating account…" : needsDoc ? "Submit for verification" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Already registered?{" "}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}