
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Loader2,
  Inbox,
  Crown,
  Calendar,
  Users,
  AlertCircle,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const labelFor = (report, key) =>
  report.reportTemplate?.fields?.find((f) => f.key === key)?.label ||
  key.replace(/_/g, " ");

const STATUS_STYLES = {
  submitted:
    "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  approved:
    "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected:
    "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  sent_back:
    "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  draft:
    "text-[var(--mist)] border-[var(--panel-border)] bg-transparent",
};

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id || "" : value;
};

export default function AdminReports() {
  const [departments, setDepartments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [initialError, setInitialError] = useState("");
  const [reportError, setReportError] = useState("");

  const [filters, setFilters] = useState({
    department: "",
    team: "",
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

  // Load departments, users and groups.
  useEffect(() => {
    let cancelled = false;

    const fetchInitial = async () => {
      setInitialError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [deptRes, userRes, teamRes] = await Promise.all([
          fetch(`${API}/api/departments`, { headers }),
          fetch(`${API}/api/users`, { headers }),
          fetch(`${API}/api/teams`, { headers }),
        ]);

        if (!deptRes.ok || !userRes.ok || !teamRes.ok) {
          throw new Error(
            "Departments, users ya groups load nahi ho paaye. Please refresh karein."
          );
        }

        const [deptData, users, teamData] = await Promise.all([
          deptRes.json(),
          userRes.json(),
          teamRes.json(),
        ]);

        if (cancelled) return;

        if (Array.isArray(deptData)) setDepartments(deptData);

        if (Array.isArray(users)) {
          setAllUsers(users.filter((u) => u.role !== "admin"));
        }

        if (Array.isArray(teamData)) {
          setTeams(teamData);
        }
      } catch (err) {
        if (!cancelled) {
          setInitialError(err.message || "Initial data load nahi hua.");
        }
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [API, token]);

  // Show groups belonging to the selected department.
  const filteredTeams = teams.filter((team) => {
    if (!filters.department) return true;
    return (
      getId(team.department) === filters.department
    );
  });

  // Clear selected group when the department changes.
  const updateFilter = (key, value) => {
    setFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === "department") {
        next.team = "";
      }

      return next;
    });
  };

  // Load reports whenever a report filter changes.
  useEffect(() => {
    let cancelled = false;

    const fetchReports = async () => {
      setLoading(true);
      setReportError("");

      try {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.set(key, value);
        });

        const res = await fetch(
          `${API}/api/reports/team/all?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.message || "Reports load nahi ho paaye."
          );
        }

        if (!cancelled) {
          setReports(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setReports([]);
          setReportError(
            err.message || "Reports load karte waqt error aaya."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReports();

    return () => {
      cancelled = true;
    };
  }, [filters, token]);

  const deptName = (id) =>
    departments.find((d) => d._id === getId(id))?.name || "—";

  const teamName = (teamValue) => {
    const teamId = getId(teamValue);
    const team = teams.find((t) => t._id === teamId);

    return team?.name || teamValue?.name || "";
  };

  const teamLeadName = (teamValue) => {
    const teamId = getId(teamValue);
    const team = teams.find((t) => t._id === teamId);

    return (
      team?.teamLead?.name ||
      teamValue?.teamLead?.name ||
      ""
    );
  };

  const selectedTeam = teams.find(
    (team) => team._id === filters.team
  );

  const selectedTeamLead = selectedTeam?.teamLead?.name;

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
            See reports by department, group, employee, and team
            lead — no download needed.
          </p>
        </div>

        {/* Report submitter filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: "", label: "All" },
            { key: "employee", label: "Employee reports" },
            { key: "teamlead", label: "Team Lead reports" },
          ].map((tab) => (
            <button
              key={tab.key || "all"}
              type="button"
              onClick={() =>
                updateFilter("submitterRole", tab.key)
              }
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

        {/* Department, group, report type, status and employee filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={filters.department}
            onChange={(e) =>
              updateFilter("department", e.target.value)
            }
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All departments</option>
            {departments.map((department) => (
              <option
                key={department._id}
                value={department._id}
              >
                {department.name}
              </option>
            ))}
          </select>

          <select
            value={filters.team}
            onChange={(e) =>
              updateFilter("team", e.target.value)
            }
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All groups</option>
            {filteredTeams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>

          <select
            value={filters.reportType}
            onChange={(e) =>
              updateFilter("reportType", e.target.value)
            }
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) =>
              updateFilter("status", e.target.value)
            }
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sent_back">Sent back</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={filters.employee}
            onChange={(e) =>
              updateFilter("employee", e.target.value)
            }
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)] max-w-[220px]"
          >
            <option value="">All employees</option>
            {allUsers.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.employeeId})
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div
            className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
            onClick={() => startRef.current?.showPicker?.()}
          >
            <Calendar
              size={16}
              className="absolute left-3 text-[var(--mist)] pointer-events-none"
            />
            <input
              ref={startRef}
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                updateFilter("startDate", e.target.value)
              }
              className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
              aria-label="Start date"
            />
          </div>

          <div
            className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer"
            onClick={() => endRef.current?.showPicker?.()}
          >
            <Calendar
              size={16}
              className="absolute left-3 text-[var(--mist)] pointer-events-none"
            />
            <input
              ref={endRef}
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                updateFilter("endDate", e.target.value)
              }
              className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
              aria-label="End date"
            />
          </div>

          {(filters.startDate || filters.endDate) && (
            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({
                  ...current,
                  startDate: "",
                  endDate: "",
                }))
              }
              className="text-xs text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
            >
              Clear dates
            </button>
          )}
        </div>

        {/* Selected department/group leadership */}
        {filters.department && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 text-xs font-mono text-[#60A5FA]">
            <span className="flex items-center gap-2">
              <Crown size={12} />
              Department: {deptName(filters.department)}
            </span>

            {filters.team && (
              <span className="flex items-center gap-2">
                <Users size={12} />
                Group: {teamName(filters.team)}
                {selectedTeamLead
                  ? ` · Team Leader: ${selectedTeamLead}`
                  : " · No Team Leader assigned"}
              </span>
            )}
          </div>
        )}

        {initialError && (
          <div className="flex items-start gap-2 mb-4 rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 text-sm text-[var(--paper)]">
            <AlertCircle
              size={18}
              className="shrink-0 text-[var(--error)]"
            />
            <span>{initialError}</span>
          </div>
        )}

        {reportError && (
          <div className="flex items-start gap-2 mb-4 rounded-lg border border-[var(--error)]/40 bg-[var(--error)]/10 p-3 text-sm text-[var(--paper)]">
            <AlertCircle
              size={18}
              className="shrink-0 text-[var(--error)]"
            />
            <span>{reportError}</span>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading reports…
          </div>
        )}

        {!loading && !reportError && reports.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox
              size={32}
              className="text-[var(--mist)]"
            />
            <p className="text-[var(--mist)] text-sm">
              No reports match this filter.
            </p>
          </div>
        )}

        {/* Report cards */}
        <AnimatePresence initial={false}>
          {reports.map((report) => {
            const reportTeam =
              report.team || report.employee?.team;

            const reportTeamName =
              teamName(reportTeam) ||
              reportTeam?.name ||
              "";

            const reportTeamLead =
              teamLeadName(reportTeam);

            return (
              <motion.div
                key={report._id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 mb-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-display font-semibold text-[var(--paper)] flex items-center gap-2 flex-wrap">
                      {report.employee?.name || "Unknown employee"}

                      <span className="text-[var(--mist)] font-mono text-xs">
                        ({report.employee?.employeeId || "—"})
                      </span>

                      {report.employee?.role === "teamlead" && (
                        <span className="text-[10px] font-mono uppercase tracking-wide border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full px-2 py-0.5">
                          Team Lead
                        </span>
                      )}

                      {report.isEdited && (
                        <span className="text-[10px] font-mono uppercase tracking-wide border border-[#60A5FA]/40 bg-[#60A5FA]/10 text-[#60A5FA] rounded-full px-2 py-0.5">
                          Edited
                        </span>
                      )}
                    </p>

                    <p className="text-[var(--mist)] text-xs font-mono mt-1">
                      {deptName(report.department)} ·{" "}
                      {report.reportType}
                    </p>

                    {reportTeamName && (
                      <p className="text-[#60A5FA] text-xs font-mono mt-1 flex items-center gap-1">
                        <Users size={11} />
                        Group: {reportTeamName}
                      </p>
                    )}

                    {reportTeamLead && (
                      <p className="text-[#60A5FA] text-xs font-mono mt-1 flex items-center gap-1">
                        <Crown size={11} />
                        Team Leader: {reportTeamLead}
                      </p>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 shrink-0 ${
                      STATUS_STYLES[report.status] ||
                      STATUS_STYLES.draft
                    }`}
                  >
                    {(report.status || "draft").replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--mist)] font-mono mb-4">
                  <Calendar size={12} />
                  Period:{" "}
                  {report.reportDate
                    ? new Date(report.reportDate).toLocaleDateString()
                    : "—"}
                  {" · "}Submitted{" "}
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString()
                    : "—"}
                </div>

                {/* Report fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 border-t border-[var(--panel-border)] pt-4">
                  {Object.entries(report.data || {}).map(
                    ([key, value]) => (
                      <div key={key} className="min-w-0">
                        <p className="text-[10px] font-mono uppercase text-[var(--mist)]">
                          {labelFor(report, key)}

                          {report.editedFields?.includes(key) && (
                            <span className="text-[#60A5FA] normal-case ml-1">
                              (edited)
                            </span>
                          )}
                        </p>

                        {typeof value === "string" &&
                        value.startsWith("http") ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--amber)] hover:text-[var(--amber-dim)] underline break-all"
                          >
                            View file
                          </a>
                        ) : (
                          <p className="text-sm text-[var(--paper)] whitespace-pre-wrap break-words">
                            {value === null ||
                            value === undefined ||
                            value === ""
                              ? "—"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value)}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>

                {report.reviewComment && (
                  <p className="text-xs text-[var(--mist)] italic mt-3">
                    Review comment: "{report.reviewComment}"
                  </p>
                )}

                {report.adminReview?.comment && (
                  <p className="text-xs text-[var(--mist)] italic mt-2">
                    Admin comment: "{report.adminReview.comment}"
                  </p>
                )}

                {report.attachment?.url && (
                  <a
                    href={report.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors"
                  >
                    📎 {report.attachment.filename || "View attachment"}
                  </a>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}