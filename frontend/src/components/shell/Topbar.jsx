import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sun, Moon, Bell, LogOut, ChevronDown, User, Menu } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";

export default function Topbar({ onMenuClick, breadcrumb }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch]         = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen]     = useState(false);
  const profileRef = useRef(null);
  const notifRef   = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/records?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center gap-4 px-4 sm:px-6 sticky top-0 z-20">
      <button onClick={onMenuClick} className="md:hidden text-muted hover:text-foreground">
        <Menu className="w-5 h-5" />
      </button>

      {breadcrumb && (
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted flex-shrink-0">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border">/</span>}
              <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
            </span>
          ))}
        </div>
      )}

      <form onSubmit={submitSearch} className="flex-1 max-w-sm ml-auto sm:ml-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="w-full bg-bg border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
          />
        </div>
      </form>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={toggleTheme} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-bg transition-colors">
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen((v) => !v)} className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-bg transition-colors">
            <Bell className="w-4 h-4" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-md p-4 z-30">
              <p className="text-xs font-medium text-foreground mb-1">Notifications</p>
              <p className="text-xs text-muted">No notifications yet — real-time alerts arrive in Phase 6.</p>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-bg transition-colors">
            <div className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-md py-1.5 z-30">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                <p className="text-xs text-muted capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-bg transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}