import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  History,
  Download,
  Loader2,
  Inbox,
  Calendar,
  FileText,
  AlertCircle,
  ChevronDown,
  Pencil,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const STATUS_STYLES = {
  submitted: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  approved: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  sent_back: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  draft: "text-[var(--mist)] border-[var(--panel-border)]",
};

export default function MyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false); // false = last 2 only
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [exportStatus, setExportStatus] = useState("idle"); // idle | downloading | error
  const [errorMsg, setErrorMsg] = useState("");

  const startRef = useRef(null);
  const endRef = useRef(null);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const backTo = role === "teamlead" ? "/teamlead" : "/dashboard";

  // matches the backend's same-day + not-yet-reviewed rule, so the Edit
  // button only appears when editing would actually succeed
  const isEditable = (report) => {
    const submittedDay = new Date(report.createdAt).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return submittedDay === today && !["approved", "rejected"].includes(report.status);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      // limit=2 unless the user expanded to full history
      const params = new URLSearchParams();
      if (!showAll) params.append("limit", "2");

      const res = await fetch(`${API}/api/reports/mine?${params.toString()}`, {
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
  }, [showAll]);

  const handleExport = async () => {
    setExportStatus("downloading");
    setErrorMsg("");

    const params = new URLSearchParams();
    if (range.startDate) params.append("startDate", range.startDate);
    if (range.endDate) params.append("endDate", range.endDate);
    // Team Leads default to their whole department on this endpoint, so ask
    // for just their own rows here
    if (role === "teamlead") params.append("onlyMine", "true");

    try {
      const res = await fetch(`${API}/api/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setExportStatus("error");
        setErrorMsg(data.message || "No reports found for this date range");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-reports.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportStatus("idle");
    } catch (err) {
      console.error(err);
      setExportStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <History size={14} />
              My reports
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
              Report history
            </h1>
          </div>

          <Link
            to={backTo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium shrink-0"
          >
            <FileText size={16} />
            File a report
          </Link>
        </div>

        {/* export own reports by date range */}
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 mb-8">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-4">
            Download my reports
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--mist)] mb-2">
                From
              </label>
              <div
                className="relative flex items-center bg-[var(--ink)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
                onClick={() => startRef.current?.showPicker?.()}
              >
                <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
                <input
                  ref={startRef}
                  type="date"
                  value={range.startDate}
                  onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
                  className="w-full bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--mist)] mb-2">
                To
              </label>
              <div
                className="relative flex items-center bg-[var(--ink)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
                onClick={() => endRef.current?.showPicker?.()}
              >
                <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
                <input
                  ref={endRef}
                  type="date"
                  value={range.endDate}
                  onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
                  className="w-full bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
                />
              </div>
            </div>
          </div>

          {exportStatus === "error" && (
            <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium mb-3">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={exportStatus === "downloading"}
            className="w-full h-11 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {exportStatus === "downloading" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Preparing file…
              </>
            ) : (
              <>
                <Download size={16} />
                Download Excel
              </>
            )}
          </motion.button>

          <p className="text-[10px] text-[var(--mist)] mt-2 text-center">
            Leave both dates empty to download all your reports.
          </p>
        </div>

        {/* history list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-[var(--paper)]">
            {showAll ? "All reports" : "Last 2 reports"}
          </h2>
          <button
            onClick={() => setShowAll((s) => !s)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors"
          >
            {showAll ? "Show last 2 only" : "View full history"}
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
            />
          </button>
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
            <p className="text-[var(--mist)] text-sm">You haven't submitted any reports yet.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {reports.map((report) => (
            <motion.div
              key={report._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 mb-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)] capitalize flex items-center gap-2 flex-wrap">
                    {report.reportType} report
                    {report.isEdited && (
                      <span className="flex items-center gap-1 text-[10px] normal-case text-[#60A5FA] border border-[#60A5FA]/40 bg-[#60A5FA]/10 rounded-full px-2 py-0.5">
                        <Pencil size={9} />
                        edited
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--mist)] text-xs font-mono mt-0.5">
                    Period: {new Date(report.reportDate).toLocaleDateString()} · Submitted{" "}
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 ${STATUS_STYLES[report.status]}`}
                  >
                    {report.status.replace("_", " ")}
                  </span>
                  {isEditable(report) && (
                    <Link
                      to={`/reports/${report._id}/edit`}
                      className="flex items-center gap-1 text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors"
                    >
                      <Pencil size={12} />
                      Edit
                    </Link>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4">
                {Object.entries(report.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-mono uppercase text-[var(--mist)] flex items-center gap-1">
                      {key}
                      {report.editedFields?.includes(key) && (
                        <span className="text-[#60A5FA] normal-case">(edited)</span>
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

              {report.reviewComment && (
                <p className="text-xs text-[var(--mist)] italic mt-3">
                  Reviewer: "{report.reviewComment}"
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}