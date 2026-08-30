import { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, Loader2, AlertCircle } from "lucide-react";

export default function TeamExport() {
  const [filters, setFilters] = useState({
    reportType: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  const [status, setStatus] = useState("idle"); // idle | downloading | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const handleExport = async () => {
    setStatus("downloading");
    setErrorMsg("");

    // no department param needed — backend locks it to the Team Lead's own department
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const res = await fetch(
        `https://erm-3w28.onrender.com/api/reports/export?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.message || "No reports match this filter");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "team-reports-export.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <FileSpreadsheet size={14} />
            Team Lead · Export
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
            Download reports
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Export daily, weekly, or monthly reports from your department.
          </p>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Report type
              </label>
              <select
                value={filters.reportType}
                onChange={(e) => updateFilter("reportType", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              >
                <option value="">All types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="sent_back">Sent back</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                From
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter("startDate", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                To
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter("endDate", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              />
            </div>
          </div>

          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={status === "downloading"}
            className="w-full h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === "downloading" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Preparing file…
              </>
            ) : (
              <>
                <Download size={18} />
                Download Excel
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}