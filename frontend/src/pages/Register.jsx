import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";

export default function Register() {
  const [form, setForm] = useState({
    email: "", username: "", first_name: "", last_name: "",
    password: "", password2: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      const d = err.response?.data;
      if (d) {
        const key = Object.keys(d)[0];
        setError(Array.isArray(d[key]) ? d[key][0] : String(d[key]));
      } else {
        setError("Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md">
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
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm">{error}</div>
          )}
          <form onSubmit={submit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-gray-400 font-normal">(min 8 chars)</span></label>
              <input type="password" required value={form.password} onChange={set("password")} className={input} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" required value={form.password2} onChange={set("password2")} className={input} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? "Creating account…" : "Create account"}
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