import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Github, Chrome } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [form, setForm]       = useState({ email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left — hero, the one panel allowed to feel premium */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <span className="font-bold text-sm">M</span>
            </div>
            <span className="font-semibold">MediLocker</span>
          </div>

          <div>
            <h1 className="text-3xl font-semibold leading-tight max-w-md">
              One secure vault for every health record you own.
            </h1>
            <p className="mt-3 text-white/70 max-w-sm text-sm">
              Encrypted storage, emergency-ready access, and role-based control — built for patients, doctors, and responders alike.
            </p>

            <div className="mt-8 backdrop-blur-md bg-white/10 border border-white/15 rounded-2xl p-5 max-w-sm">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="w-4 h-4" /> Emergency access, audited
              </div>
              <p className="text-xs text-white/60 mt-1.5">
                Every QR scan and emergency view is logged automatically — full transparency, every time.
              </p>
            </div>
          </div>

          <p className="text-xs text-white/40">© {new Date().getFullYear()} MediLocker</p>
        </motion.div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-foreground">MediLocker</span>
          </div>

          <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
          <p className="text-sm text-muted mt-1">Welcome back — enter your details below.</p>

          {error && (
            <div className="mt-5 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="email" required autoComplete="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="password" required autoComplete="current-password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Signing in…" : <>Sign in <ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
          </form>

          <div className="flex items-center gap-2 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button disabled title="Coming soon"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm text-muted opacity-50 cursor-not-allowed">
              <Chrome className="w-4 h-4" /> Google
            </button>
            <button disabled title="Coming soon"
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm text-muted opacity-50 cursor-not-allowed">
              <Github className="w-4 h-4" /> GitHub
            </button>
          </div>

          <p className="mt-7 text-center text-sm text-muted">
            No account?{" "}
            <Link to="/register" className="text-accent hover:underline font-medium">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}