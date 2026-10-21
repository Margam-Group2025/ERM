import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Check,
  X,
  Undo2,
  Loader2,
  Inbox,
  Calendar,
  AlertCircle,
  UserCheck,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// the heading for a field = the label from the template THIS report was
// filled with (falls back to a tidied-up key for very old reports)
const labelFor = (report, key) =>
  report.reportTemplate?.fields?.find((f) => f.key === key)?.label ||
  key.replace(/_/g, " ");

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "returned", label: "Returned" },
  { key: "rejected", label: "Rejected" },
];

const OUTCOME_STYLES = {
  approved: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  returned: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  pending: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
};

export default function AdminReviewQueue() {
  const [tab, setTab] = useState("pending");
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    team: "",
    employee: "",
    reportType: "",
    startDate: "",
    endDate: "",
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({}); // reportId -> comment text
  const [errors, setErrors] = useState({}); // reportId -> message
  const [decidingId, setDecidingId] = useState(null);

  const startRef = useRef(null);
  const endRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadFilters = async () => {
      const [tRes, uRes] = await Promise.all([
        fetch(`${API}/api/teams`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [t, u] = await Promise.all([tRes.json(), uRes.json()]);
      if (tRes.ok) setTeams(t);
      if (uRes.ok) setEmployees(u.filter((x) => x.role === "employee" && x.team));
    };
    loadFilters();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: tab });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await fetch(`${API}/api/reports/admin-review?${params.toString()}`, {
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
    fetchQueue();
  }, [tab, filters]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const decide = async (report, decision) => {
    const comment = (comments[report._id] || "").trim();
    if (decision !== "approved" && !comment) {
      setErrors((p) => ({
        ...p,
        [report._id]: "Return ya reject karne se pehle comment likho — employee ko wahi dikhega.",
      }));
      return;
    }
    setErrors((p) => ({ ...p, [report._id]: "" }));
    setDecidingId(report._id);
    try {
      const res = await fetch(`${API}/api/reports/${report._id}/admin-review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors((p) => ({ ...p, [report._id]: data.message || "Could not save the decision" }));
        return;
      }
      setReports((prev) => prev.filter((r) => r._id !== report._id)); // leaves the pending list
    } catch (err) {
      console.error(err);
      setErrors((p) => ({ ...p, [report._id]: "Could not reach the server." }));
    } finally {
      setDecidingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <ClipboardCheck size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Final review
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Reports a Team Leader has already approved. Approve them, return them to the employee
            for correction, or reject.
          </p>
        </div>

        {/* status tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                tab === t.key
                  ? "bg-[var(--amber)] text-[var(--ink)]"
                  : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)] hover:border-[var(--mist)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={filters.team}
            onChange={(e) => updateFilter("team", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All groups (combined)</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>
                {t.department?.name} — {t.name}
              </option>
            ))}
          </select>

          <select
            value={filters.employee}
            onChange={(e) => updateFilter("employee", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)] max-w-[220px]"
          >
            <option value="">All employees</option>
            {employees.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.employeeId})
              </option>
            ))}
          </select>

          <select
            value={filters.reportType}
            onChange={(e) => updateFilter("reportType", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { ref: startRef, key: "startDate" },
            { ref: endRef, key: "endDate" },
          ].map(({ ref, key }) => (
            <div
              key={key}
              className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
              onClick={() => ref.current?.showPicker?.()}
            >
              <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
              <input
                ref={ref}
                type="date"
                value={filters[key]}
                onChange={(e) => updateFilter(key, e.target.value)}
                className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
              />
            </div>
          ))}
          {(filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters((f) => ({ ...f, startDate: "", endDate: "" }))}
              className="text-xs text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
            >
              Clear dates
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">
              {tab === "pending"
                ? "Nothing is waiting for your final review."
                : "No reports in this category."}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {reports.map((report) => (
            <motion.div
              key={report._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 mb-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)] flex items-center gap-2 flex-wrap">
                    {report.employee?.name}{" "}
                    <span className="text-[var(--mist)] font-mono text-xs">
                      ({report.employee?.employeeId})
                    </span>
                    {report.employee?.team?.name && (
                      <span className="text-[10px] font-mono uppercase tracking-wide border border-[var(--panel-border)] text-[var(--mist)] rounded-full px-2 py-0.5">
                        {report.employee.team.name}
                      </span>
                    )}
                    {report.isEdited && (
                      <span className="text-[10px] font-mono uppercase tracking-wide border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full px-2 py-0.5">
                        edited
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--mist)] text-xs font-mono mt-0.5">
                    {report.department?.name} · {report.reportType} ·{" "}
                    {new Date(report.reportDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 shrink-0 ${
                    OUTCOME_STYLES[report.adminReview?.status] || ""
                  }`}
                >
                  {report.adminReview?.status}
                </span>
              </div>

              {report.reviewedBy && report.adminReview?.status === "pending" && (
                <p className="flex items-center gap-1.5 text-xs text-[var(--success)] font-mono mb-3">
                  <UserCheck size={12} />
                  Approved by Team Leader {report.reviewedBy.name}
                  {report.reviewedAt && ` · ${new Date(report.reviewedAt).toLocaleString()}`}
                </p>
              )}

              {report.reviewComment && report.adminReview?.status === "pending" && (
                <p className="text-xs text-[var(--mist)] italic mb-3">
                  Team Leader: "{report.reviewComment}"
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4">
                {Object.entries(report.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-mono uppercase text-[var(--mist)]">
                      {labelFor(report, key)}
                      {report.editedFields?.includes(key) && (
                        <span className="text-[#60A5FA] normal-case ml-1">(edited)</span>
                      )}
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

              {/* decided reports: just show the outcome */}
              {report.adminReview?.status !== "pending" && report.adminReview?.comment && (
                <p className="text-xs text-[var(--mist)] italic mt-4">
                  Your comment: "{report.adminReview.comment}"
                </p>
              )}

              {/* pending: decide */}
              {report.adminReview?.status === "pending" && (
                <div className="mt-5 pt-4 border-t border-[var(--panel-border)]">
                  <textarea
                    rows={2}
                    placeholder="Comment (required to return or reject)…"
                    value={comments[report._id] || ""}
                    onChange={(e) =>
                      setComments((p) => ({ ...p, [report._id]: e.target.value }))
                    }
                    className="w-full bg-[var(--ink)] text-[var(--paper)] text-sm rounded-lg p-3 outline-none border border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors resize-none mb-3"
                  />

                  {errors[report._id] && (
                    <div className="flex items-center gap-2 text-[var(--error)] text-xs font-medium mb-3">
                      <AlertCircle size={14} />
                      {errors[report._id]}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => decide(report, "approved")}
                      disabled={decidingId === report._id}
                      className="flex-1 min-w-[110px] h-10 rounded-lg bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 hover:bg-[var(--success)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {decidingId === report._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => decide(report, "returned")}
                      disabled={decidingId === report._id}
                      className="flex-1 min-w-[110px] h-10 rounded-lg bg-[#60A5FA]/15 text-[#60A5FA] border border-[#60A5FA]/30 hover:bg-[#60A5FA]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <Undo2 size={14} />
                      Return
                    </button>
                    <button
                      onClick={() => decide(report, "rejected")}
                      disabled={decidingId === report._id}
                      className="flex-1 min-w-[110px] h-10 rounded-lg bg-[var(--error)]/15 text-[var(--error)] border border-[var(--error)]/30 hover:bg-[var(--error)]/25 transition-colors text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <X size={14} />
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}