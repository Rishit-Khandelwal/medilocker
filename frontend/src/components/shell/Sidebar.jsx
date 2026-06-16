import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, ShieldAlert, Settings as SettingsIcon,
  ChevronLeft, ChevronRight, Stethoscope, Siren, Users, Calendar, Pill,
  MessageSquare, BarChart3, ScanLine, History, Building2, CreditCard,
  Cpu, Flag, Database, ExternalLink,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext.jsx";

const BACKEND_ORIGIN = "http://localhost:8000"; // TODO: env var for production

const NAV_BY_ROLE = {
  PATIENT: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Records", to: "/records", icon: FileText },
    { label: "Emergency", to: "/emergency/manage", icon: ShieldAlert },
    { label: "Timeline", icon: History, soon: true },
    { label: "Medications", icon: Pill, soon: true },
    { label: "Appointments", icon: Calendar, soon: true },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ],
  DOCTOR: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Patients", icon: Users, soon: true },
    { label: "Appointments", icon: Calendar, soon: true },
    { label: "Prescriptions", icon: Pill, soon: true },
    { label: "Messages", icon: MessageSquare, soon: true },
    { label: "Analytics", icon: BarChart3, soon: true },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ],
  RESPONDER: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Scan QR", icon: ScanLine, soon: true },
    { label: "Access History", icon: History, soon: true },
    { label: "Active Cases", icon: Siren, soon: true },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Admin Panel", href: `${BACKEND_ORIGIN}/admin/`, icon: Database, external: true },
    { label: "Analytics", icon: BarChart3, soon: true },
    { label: "Security", icon: ShieldAlert, soon: true },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ],
  SUPERADMIN: [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "Admin Panel", href: `${BACKEND_ORIGIN}/admin/`, icon: Database, external: true },
    { label: "Organizations", icon: Building2, soon: true },
    { label: "Billing", icon: CreditCard, soon: true },
    { label: "AI Models", icon: Cpu, soon: true },
    { label: "Feature Flags", icon: Flag, soon: true },
    { label: "Settings", to: "/settings", icon: SettingsIcon },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const items = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.PATIENT;

  return (
    <aside className={`hidden md:flex flex-col bg-surface border-r border-border transition-all duration-200 ${collapsed ? "w-16" : "w-56"} shrink-0`}>
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">M</span>
        </div>
        {!collapsed && <span className="ml-2 font-semibold text-foreground text-sm">MediLocker</span>}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon   = item.icon;
          const active = item.to && pathname.startsWith(item.to);

          if (item.external) {
            return (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-bg transition-colors">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
              </a>
            );
          }

          if (item.soon) {
            return (
              <div key={item.label} className="flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-muted/50 cursor-default">
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg border border-border">Soon</span>}
              </div>
            );
          }

          return (
            <Link key={item.label} to={item.to}
              className={`flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground hover:bg-bg"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button onClick={onToggle}
        className="h-11 flex items-center justify-center border-t border-border text-muted hover:text-foreground hover:bg-bg transition-colors">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}