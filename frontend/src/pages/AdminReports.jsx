import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Loader2, Inbox, Crown, Calendar } from "lucide-react";

const API = import.meta.env.VITE_API_URL  || "https://erm-3w28.onrender.com";;

const STATUS_STYLES = {
  submitted: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  approved: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  sent_back: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  draft: "text-[var(--mist)] border-[var(--panel-border)] bg-transparent",
};

export default function AdminReports() {
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // for the employee filter dropdown
  const [teamLeadByDept, setTeamLeadByDept] = useState({}); // departmentId -> lead name
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: "",
    reportType: "",
    status: "",
    submitterRole: "",
    employee: "",
    startDate: "",
    endDate: "",
  });
  const startRef = useRef(null);
  const endRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchInitial = async () => {
      const [deptRes, userRes] = await Promise.all([
        fetch(`${API}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const deptData = await deptRes.json();
      const users = await userRes.json();

      if (Array.isArray(deptData)) setDepartments(deptData);
      if (Array.isArray(users)) {
        setAllUsers(users.filter((u) => u.role !== "admin"));
        const map = {};
        users
          .filter((u) => u.role === "teamlead")
          .forEach((lead) => {
            const deptId = lead.department?._id || lead.department;
            if (deptId) map[deptId] = lead.name;
          });
        setTeamLeadByDept(map);
      }
    };
    fetchInitial();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await fetch(
        `${API}/api/reports/team/all?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
  }, [filters]);

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const deptName = (id) => departments.find((d) => d._id === id)?.name || "—";

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Eye size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Browse reports
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            See every report by department, employee, and team lead — no download needed.
          </p>
        </div>

        {/* who submitted — keeps employee reports and team lead reports separate */}
        <div className="flex gap-2 mb-4">
          {[
            { key: "", label: "All" },
            { key: "employee", label: "Employee reports" },
            { key: "teamlead", label: "Team Lead reports" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => updateFilter("submitterRole", tab.key)}
              className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                filters.submitterRole === tab.key
                  ? "bg-[#60A5FA] text-[var(--ink)]"
                  : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)] hover:border-[var(--mist)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filters.department}
            onChange={(e) => updateFilter("department", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
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

          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sent_back">Sent back</option>
            <option value="draft">Draft</option>
          </select>

          {/* pick a specific employee/team lead by name+ID to see only their reports */}
          <select
            value={filters.employee}
            onChange={(e) => updateFilter("employee", e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)] max-w-[220px]"
          >
            <option value="">All employees</option>
            {allUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.employeeId})
              </option>
            ))}
          </select>
        </div>

        {/* date range — filters by the report's period date */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div
            className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
            onClick={() => startRef.current?.showPicker?.()}
          >
            <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
            <input
              ref={startRef}
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
              placeholder="From"
            />
          </div>
          <div
            className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
            onClick={() => endRef.current?.showPicker?.()}
          >
            <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
            <input
              ref={endRef}
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
              placeholder="To"
            />
          </div>
          {(filters.startDate || filters.endDate) && (
            <button
              onClick={() => setFilters((f) => ({ ...f, startDate: "", endDate: "" }))}
              className="text-xs text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
            >
              Clear dates
            </button>
          )}
        </div>

        {/* current department's team lead, shown when a single department is selected */}
        {filters.department && (
          <div className="flex items-center gap-2 mb-4 text-xs font-mono text-[#60A5FA]">
            <Crown size={12} />
            {teamLeadByDept[filters.department]
              ? `Led by ${teamLeadByDept[filters.department]}`
              : "No team lead assigned"}
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading reports…
          </div>
        )}

        {!loading && reports.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">No reports match this filter.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {reports.map((report) => (
            <motion.div
              key={report._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 mb-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)] flex items-center gap-2 flex-wrap">
                    {report.employee?.name}{" "}
                    <span className="text-[var(--mist)] font-mono text-xs">
                      ({report.employee?.employeeId})
                    </span>
                    {report.employee?.role === "teamlead" && (
                      <span className="text-[10px] font-mono uppercase tracking-wide border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full px-2 py-0.5">
                        Team Lead
                      </span>
                    )}
                    {report.isEdited && (
                      <span className="text-[10px] font-mono uppercase tracking-wide border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full px-2 py-0.5">
                        edited
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--mist)] text-xs font-mono mt-0.5">
                    {deptName(report.department?._id || report.department)} ·{" "}
                    {report.reportType}
                  </p>
                  {teamLeadByDept[report.department?._id || report.department] && (
                    <p className="text-[#60A5FA] text-xs font-mono mt-0.5 flex items-center gap-1">
                      <Crown size={10} />
                      Team lead: {teamLeadByDept[report.department?._id || report.department]}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 shrink-0 ${STATUS_STYLES[report.status]}`}
                >
                  {report.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[var(--mist)] font-mono mb-4">
                <Calendar size={12} />
                Period: {new Date(report.reportDate).toLocaleDateString()} · Submitted{" "}
                {new Date(report.createdAt).toLocaleString()}
              </div>

              {/* full report data — the actual preview */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4">
                {Object.entries(report.data || {}).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-[10px] font-mono uppercase text-[var(--mist)]">
                      {key}
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