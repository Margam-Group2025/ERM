import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  UserPlus,
  FileSpreadsheet,
  Users,
  Eye,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", label: "Templates", icon: Layers, end: true },
  { to: "/admin/reports", label: "View Reports", icon: Eye },
  { to: "/admin/users", label: "Add User", icon: UserPlus },
  { to: "/admin/team", label: "Manage Team", icon: Users },
  { to: "/admin/export", label: "Export Reports", icon: FileSpreadsheet },
];

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const navContent = (
    <>
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
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive ? "text-[var(--ink)]" : "text-[var(--mist)] hover:text-[var(--paper)]"
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
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--ink)] lg:flex">
      {/* mobile top bar — only visible below lg */}
      <div className="flex lg:hidden items-center justify-between p-4 border-b border-[var(--panel-border)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[var(--amber)]" />
          <span className="font-mono text-xs tracking-widest text-[var(--mist)] uppercase">
            Admin
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="w-9 h-9 rounded-lg border border-[var(--panel-border)] text-[var(--mist)] flex items-center justify-center"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* mobile slide-in drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 h-full w-64 bg-[var(--panel)] border-r border-[var(--panel-border)] flex flex-col p-5 z-50 lg:hidden"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 text-[var(--mist)]"
              >
                <X size={18} />
              </button>
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* desktop sidebar — only visible at lg and up */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-[var(--panel-border)] flex-col p-5">
        {navContent}
      </aside>

      {/* active page renders here */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}