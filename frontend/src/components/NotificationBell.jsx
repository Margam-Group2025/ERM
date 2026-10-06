import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL;
const POLL_INTERVAL_MS = 20000;

// where a notification should take the viewer when clicked, based on its
// type and the viewer's own role (the same notification type means a
// different destination for a Team Lead than for an Employee)
function getLink(type, role) {
  switch (type) {
    case "task_assigned":
      return role === "teamlead" ? "/teamlead/my-tasks" : "/tasks";
    case "edit_request":
      return role === "admin" ? "/admin/edit-requests" : "/teamlead/edit-requests";
    case "edit_approved":
    case "edit_denied":
      return role === "teamlead" ? "/teamlead/my-reports" : "/my-reports";
    case "report_reviewed":
    case "report_sent_back":
      return role === "teamlead" ? "/teamlead/my-reports" : "/my-reports";
    default:
      return null;
  }
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API}/api/notifications/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open) fetchNotifications();
  };

  const markOneRead = async (id) => {
    try {
      await fetch(`${API}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      markOneRead(n._id); // fire and forget
    }

    const link = getLink(n.type, role);
    setOpen(false);
    if (link) navigate(link);
  };

  const handleDelete = async (e, id, wasUnread) => {
    e.stopPropagation(); // don't trigger the navigate-on-click behavior
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date) => {
    const diffMs = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-lg border border-[var(--panel-border)] bg-[var(--panel)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors flex items-center justify-center shrink-0"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--error)] text-white text-[10px] font-bold flex items-center justify-center"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--panel-border)]">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--mist)]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />}
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-[var(--mist)] text-sm text-center py-8">
                  No notifications yet.
                </p>
              )}
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <motion.div
                    key={n._id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    onClick={() => handleNotificationClick(n)}
                    className={`group flex items-start gap-2 px-4 py-3 border-b border-[var(--panel-border)] last:border-b-0 transition-colors hover:bg-[var(--ink)] cursor-pointer ${
                      !n.isRead ? "bg-[var(--amber)]/5" : ""
                    }`}
                  >
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] mt-1.5 shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${n.isRead ? "ml-3.5" : ""}`}>
                      <p className="text-sm text-[var(--paper)]">{n.message}</p>
                      <p className="text-[10px] text-[var(--mist)] font-mono mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, n._id, !n.isRead)}
                      disabled={deletingId === n._id}
                      className="opacity-0 group-hover:opacity-100 text-[var(--mist)] hover:text-[var(--error)] transition-opacity shrink-0 p-1"
                    >
                      {deletingId === n._id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}