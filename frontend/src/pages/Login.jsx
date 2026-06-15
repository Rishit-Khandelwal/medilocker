import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Login() {
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
        <Logo />
        <h1 className="mt-4 text-center text-2xl font-bold text-gray-900">MediLocker</h1>
        <p className="mt-1 text-center text-sm text-gray-500">Sign in to your account</p>

        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && <Alert>{error}</Alert>}
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input type="email" required autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={input} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input type="password" required autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={input} placeholder="••••••••" />
            </Field>
            <Btn loading={loading}>Sign in</Btn>
          </form>
          <p className="mt-5 text-center text-sm text-gray-500">
            No account?{" "}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── shared micro-components (Login + Register share these) ────────────────────
const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

function Logo() {
  return (
    <div className="flex justify-center">
      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    </div>
  );
}

function Alert({ children }) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Btn({ loading, children }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
      {loading ? "Please wait…" : children}
    </button>
  );
}