import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Lock,
  Check,
  X,
  Loader2,
  Inbox,
  Clock,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function EditRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const backTo = role === "admin" ? "/admin" : "/teamlead";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reports/edit-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (reportId, decision) => {
    setRespondingId(reportId);
    try {
      const res = await fetch(`${API}/api/reports/${reportId}/edit-request`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== reportId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <Lock size={14} />
              Edit requests
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
              Approve edit access
            </h1>
            <p className="text-[var(--mist)] text-sm mt-1">
              {role === "admin"
                ? "Team Leads are asking to edit a report they already submitted."
                : "Employees on your team are asking to edit a report they already submitted."}
            </p>
          </div>

          <Link
            to={backTo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium shrink-0"
          >
            Back
          </Link>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}

        {!loading && requests.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">No pending edit requests.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {requests.map((report) => (
            <motion.div
              key={report._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 mb-4"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)]">
                    {report.employee?.name}{" "}
                    <span className="text-[var(--mist)] font-mono text-xs">
                      ({report.employee?.employeeId})
                    </span>
                  </p>
                  <p className="text-[var(--mist)] text-xs font-mono mt-0.5">
                    {report.department?.name} · {report.reportType} report ·{" "}
                    {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide border border-[var(--amber)]/40 bg-[var(--amber)]/10 text-[var(--amber)] rounded-full px-2.5 py-1 shrink-0">
                  <Clock size={10} />
                  requested{" "}
                  {report.editRequest?.requestedAt &&
                    new Date(report.editRequest.requestedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                </span>
              </div>

              {/* current field values, so the approver can see what they're about to let someone change */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4 mb-4">
                {Object.entries(report.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-mono uppercase text-[var(--mist)]">{key}</p>
                    <p className="text-sm text-[var(--paper)]">{String(value) || "—"}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespond(report._id, "approved")}
                  disabled={respondingId === report._id}
                  className="flex-1 h-10 rounded-lg bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {respondingId === report._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Check size={14} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleRespond(report._id, "denied")}
                  disabled={respondingId === report._id}
                  className="flex-1 h-10 rounded-lg bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30 hover:bg-[var(--error)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <X size={14} />
                  Deny
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}