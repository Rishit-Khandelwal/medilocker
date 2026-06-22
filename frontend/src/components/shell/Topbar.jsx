import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Sun, Moon, Bell, BellOff, LogOut, ChevronDown, User, Menu,
  CheckCheck, FileText, Calendar, Pill, Siren,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useNotifications } from "../../contexts/NotificationContext.jsx";

const TYPE_ICON = {
  UPLOAD_COMPLETE:      FileText,
  APPOINTMENT_REMINDER: Calendar,
  MEDICINE_REMINDER:    Pill,
  EMERGENCY_TOKEN_USED: Siren,
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Topbar({ onMenuClick, breadcrumb }) {
  const { user, logout }                       = useAuth();
  const { theme, toggleTheme }                 = useTheme();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [search, setSearch]           = useState("");
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

  const handleNotifClick = (n) => {
    if (!n.is_read) markRead(n.id);
    setNotifOpen(false);
    if (n.link) navigate(n.link);
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
          <button onClick={() => setNotifOpen((v) => !v)} className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-bg transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 bg-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-md z-30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-accent hover:underline font-medium flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <BellOff className="w-5 h-5 text-muted mx-auto mb-2" />
                    <p className="text-xs text-muted">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = TYPE_ICON[n.type] || Bell;
                    return (
                      <button key={n.id} onClick={() => handleNotifClick(n)}
                        className={`w-full text-left px-4 py-3 border-b border-border last:border-0 flex gap-3 hover:bg-bg transition-colors ${!n.is_read ? "bg-accent/5" : ""}`}>
                        <div className="w-7 h-7 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-muted mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1" />}
                      </button>
                    );
                  })
                )}
              </div>
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