import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, UserPlus, FileSpreadsheet, Users, LogOut, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", label: "Templates", icon: Layers, end: true },
  { to: "/admin/users", label: "Add User", icon: UserPlus },
  { to: "/admin/team", label: "Manage Team", icon: Users },
  { to: "/admin/export", label: "Export Reports", icon: FileSpreadsheet },
];

export default function AdminLayout() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] flex">
      {/* sidebar */}
      <aside className="w-60 shrink-0 border-r border-[var(--panel-border)] flex flex-col p-5">
        <div className="flex items-center gap-2 mb-8 px-1">
          <ShieldCheck size={18} className="text-[var(--amber)]" />
          <span className="font-mono text-xs tracking-widest text-[var(--mist)] uppercase">
            Admin
          </span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--ink)]"
                    : "text-[var(--mist)] hover:text-[var(--paper)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="admin-nav-active"
                      className="absolute inset-0 bg-[var(--amber)] rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <item.icon size={16} className="relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--mist)] hover:text-[var(--error)] transition-colors duration-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* active page renders here */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}