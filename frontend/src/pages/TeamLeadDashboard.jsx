import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  ClipboardPlus,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Check,
  X,
  RotateCcw,
  Loader2,
  Inbox,
  MessageSquare,
  History,
} from "lucide-react";

const STATUS_STYLES = {
  submitted: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  approved: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  sent_back: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  draft: "text-[var(--mist)] border-[var(--panel-border)] bg-transparent",
};

export default function TeamLeadDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [activeReportId, setActiveReportId] = useState(null); // which report has the comment box open
  const [comment, setComment] = useState("");
  const [reviewingId, setReviewingId] = useState(null); // which report is mid-request

  const token = localStorage.getItem("token");
  const [departmentName, setDepartmentName] = useState("");

  useEffect(() => {
    const fetchDepartmentName = async () => {
      try {
        const departmentId = localStorage.getItem("department");
        const res = await fetch("https://erm-3w28.onrender.com/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const match = data.find((d) => d._id === departmentId);
          setDepartmentName(match ? match.name : "");
        }
      } catch {
        setDepartmentName("");
      }
    };
    fetchDepartmentName();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const query = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`https://erm-3w28.onrender.com/api/reports/team/all${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleReview = async (id, decision) => {
    setReviewingId(id);
    try {
      const res = await fetch(`https://erm-3w28.onrender.com/api/reports/${id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision, comment }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r._id !== id)); // leaves the "submitted" list once reviewed
        setComment("");
        setActiveReportId(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <ClipboardList size={14} />
              Team Lead
            </span>
            <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
              Review reports
            </h1>
            {departmentName && (
              <span className="inline-block mt-2 text-xs font-mono text-[var(--mist)] border border-[var(--panel-border)] rounded-full px-3 py-1">
                {departmentName} · Team Lead
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-wrap shrink-0">
            <Link
              to="/teamlead/report"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium"
            >
              <FileText size={16} />
              File report
            </Link>
            <Link
              to="/teamlead/export"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium"
            >
              <FileSpreadsheet size={16} />
              Export
            </Link>
            <Link
              to="/teamlead/my-tasks"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium"
            >
              <ListChecks size={16} />
              My tasks
            </Link>
            <Link
              to="/teamlead/tasks"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium"
            >
              <ClipboardPlus size={16} />
              Assign task
            </Link>
            <Link to="/my-reports" 
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium" > 
            <History size={16} /> My reports </Link>
          </div>
        </div>

        {/* status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: "submitted", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
            { key: "sent_back", label: "Sent back" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                statusFilter === tab.key
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)] hover:border-[var(--mist)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading reports…
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">No reports in this category.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {reports.map((report) => (
            <motion.div
              key={report._id}
              layout
              initial={{ opacity: 0, y: -10 }}
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
                    {report.reportType} · {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 shrink-0 ${STATUS_STYLES[report.status]}`}
                >
                  {report.status.replace("_", " ")}
                </span>
              </div>

              {/* report data fields */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {Object.entries(report.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-mono uppercase text-[var(--mist)]">
                      {key}
                    </p>
                    {typeof value === "string" && value.startsWith("http") ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--amber)] hover:text-[var(--amber-dim)] underline"
                      >
                        View file
                      </a>
                    ) : (
                      <p className="text-sm text-[var(--paper)]">{String(value) || "—"}</p>
                    )}
                  </div>
                ))}
              </div>

              {statusFilter === "submitted" && (
                <>
                  {activeReportId === report._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 overflow-hidden"
                    >
                      <textarea
                        rows={2}
                        placeholder="Add a comment (optional)…"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-[var(--ink)] text-[var(--paper)] text-sm rounded-lg p-3 outline-none border border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors resize-none"
                      />
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(report._id, "approved")}
                      disabled={reviewingId === report._id}
                      className="flex-1 h-10 rounded-lg bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReview(report._id, "sent_back")}
                      disabled={reviewingId === report._id}
                      className="flex-1 h-10 rounded-lg bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30 hover:bg-[#60A5FA]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <RotateCcw size={14} /> Send back
                    </button>
                    <button
                      onClick={() => handleReview(report._id, "rejected")}
                      disabled={reviewingId === report._id}
                      className="flex-1 h-10 rounded-lg bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30 hover:bg-[var(--error)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <X size={14} /> Reject
                    </button>
                    <button
                      onClick={() =>
                        setActiveReportId(activeReportId === report._id ? null : report._id)
                      }
                      className="w-10 h-10 rounded-lg border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--paper)] transition-colors flex items-center justify-center shrink-0"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </>
              )}

              {report.reviewComment && (
                <p className="text-xs text-[var(--mist)] italic mt-3">
                  "{report.reviewComment}"
                </p>
              )}

              {report.attachment && (
                <a
                  href={report.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors"
                >
                  📎 {report.attachment.filename}
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}