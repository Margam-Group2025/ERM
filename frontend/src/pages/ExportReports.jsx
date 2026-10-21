import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, Loader2, AlertCircle, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const selectClass =
  "w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]";
const labelClass =
  "block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2";

export default function ExportReports() {
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({
    department: "",
    team: "",
    reportType: "",
    status: "",
    adminStatus: "",
    startDate: "",
    endDate: "",
  });
  const [status, setStatus] = useState("idle"); // idle | downloading | error
  const [errorMsg, setErrorMsg] = useState("");

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const load = async () => {
      const [dRes, tRes] = await Promise.all([
        fetch(`${API}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [d, t] = await Promise.all([dRes.json(), tRes.json()]);
      if (dRes.ok) setDepartments(d);
      if (tRes.ok) setTeams(t);
    };
    load();
  }, []);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  const handleExport = async () => {
    setStatus("downloading");
    setErrorMsg("");

    // only send the filters that are actually set
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const res = await fetch(`${API}/api/reports/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.message || "No reports match this filter");
        return;
      }

      // response is a raw .xlsx file — trigger a browser download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reports-export.xlsx";
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
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <FileSpreadsheet size={14} />
            Admin · Export
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Export reports
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Filter and download reports as an Excel spreadsheet. Leave Group on "All groups" for a
            combined report.
          </p>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Department</label>
              <select
                value={filters.department}
                onChange={(e) => updateFilter("department", e.target.value)}
                className={selectClass}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Group</label>
              <select
                value={filters.team}
                onChange={(e) => updateFilter("team", e.target.value)}
                className={selectClass}
              >
                <option value="">All groups (combined)</option>
                {teams
                  .filter(
                    (t) =>
                      !filters.department || (t.department?._id || t.department) === filters.department
                  )
                  .map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.department?.name} — {t.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Report type</label>
              <select
                value={filters.reportType}
                onChange={(e) => updateFilter("reportType", e.target.value)}
                className={selectClass}
              >
                <option value="">All types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Team Leader status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter("status", e.target.value)}
                className={selectClass}
              >
                <option value="">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="sent_back">Sent back</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Admin final review</label>
            <select
              value={filters.adminStatus}
              onChange={(e) => updateFilter("adminStatus", e.target.value)}
              className={selectClass}
            >
              <option value="">Any</option>
              <option value="pending">Awaiting Admin</option>
              <option value="approved">Admin approved</option>
              <option value="rejected">Admin rejected</option>
              <option value="returned">Returned by Admin</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "From", key: "startDate", ref: startDateRef },
              { label: "To", key: "endDate", ref: endDateRef },
            ].map(({ label, key, ref }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div
                  className="relative flex items-center bg-[var(--ink)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
                  onClick={() => ref.current?.showPicker?.()}
                >
                  <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
                  <input
                    ref={ref}
                    type="date"
                    value={filters[key]}
                    onChange={(e) => updateFilter(key, e.target.value)}
                    className="w-full bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer"
                  />
                </div>
              </div>
            ))}
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