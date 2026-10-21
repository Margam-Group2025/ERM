import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Columns2, Loader2, Inbox, Calendar, Crown, Pencil } from "lucide-react";
import {
  buildComparisonCards,
  fieldRows
} from "./Groupcompare.js";

const API = (
  import.meta.env.VITE_API_URL ||
  "https://erm-3w28.onrender.com"
).replace(/\/+$/, "");

const PAGE_SIZE = 10;
const COLUMN_MIN = 130; // px — keeps two groups side by side even on a phone

const STATUS_STYLES = {
  submitted: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  approved: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
  rejected: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
  sent_back: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  draft: "text-[var(--mist)] border-[var(--panel-border)]",
};

// "Daily · Mon, 12 Oct 2026", "Weekly · week of 12 Oct 2026", "Monthly · October 2026"
function cardTitle(reportType, dateKey) {
  const d = new Date(`${dateKey}T00:00:00Z`);
  const fmt = (opts) => d.toLocaleDateString(undefined, { timeZone: "UTC", ...opts });
  if (reportType === "monthly") return `Monthly · ${fmt({ month: "long", year: "numeric" })}`;
  if (reportType === "weekly") {
    return `Weekly · week of ${fmt({ day: "numeric", month: "short", year: "numeric" })}`;
  }
  return `Daily · ${fmt({ weekday: "short", day: "numeric", month: "short", year: "numeric" })}`;
}

export default function AdminGroupReports() {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [teams, setTeams] = useState([]);
  const [reportType, setReportType] = useState("daily");
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const startRef = useRef(null);
  const endRef = useRef(null);
  const token = localStorage.getItem("token");

  // departments that are split into groups
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${API}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const grouped = data.filter((d) => d.hasGroups);
        setDepartments(grouped);
        if (grouped.length > 0) setDepartment(grouped[0]._id);
        else setLoading(false);
      }
    };
    load();
  }, []);

  // the department's groups become the columns
  useEffect(() => {
    if (!department) return;
    const load = async () => {
      const res = await fetch(`${API}/api/teams?department=${department}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTeams(data);
    };
    load();
  }, [department]);

  // only Team Leaders' own reports for this department
  useEffect(() => {
    if (!department) return;
    const load = async () => {
      setLoading(true);
      setVisible(PAGE_SIZE);
      try {
        const params = new URLSearchParams({ submitterRole: "teamlead", department });
        if (reportType) params.append("reportType", reportType);
        if (range.startDate) params.append("startDate", range.startDate);
        if (range.endDate) params.append("endDate", range.endDate);
        const res = await fetch(`${API}/api/reports/team/all?${params.toString()}`, {
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
    load();
  }, [department, reportType, range]);

  const sortedTeams = useMemo(
    () => [...teams].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
    [teams]
  );
  const { cards, unplaced } = useMemo(
    () => buildComparisonCards(reports, sortedTeams),
    [reports, sortedTeams]
  );

  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.max(sortedTeams.length, 1)}, minmax(${COLUMN_MIN}px, 1fr))`,
    minWidth: `${Math.max(sortedTeams.length, 1) * COLUMN_MIN}px`,
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Columns2 size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Team Leader reports
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Each group's Team Leader report for the same day, side by side in one card.
          </p>
        </div>

        {!loading && departments.length === 0 && (
          <p className="text-[var(--mist)] text-sm text-center py-12">
            No department has groups yet. Switch Groups ON for a department under Admin → Groups.
          </p>
        )}

        {departments.length > 0 && (
          <>
            <div className="flex flex-wrap gap-3 mb-3">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="">All types</option>
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
                    value={range[key]}
                    onChange={(e) => setRange((r) => ({ ...r, [key]: e.target.value }))}
                    className="bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer text-sm"
                  />
                </div>
              ))}
              {(range.startDate || range.endDate) && (
                <button
                  onClick={() => setRange({ startDate: "", endDate: "" })}
                  className="text-xs text-[var(--mist)] hover:text-[var(--amber)] transition-colors"
                >
                  Clear dates
                </button>
              )}
            </div>
          </>
        )}

        {loading && departments.length > 0 && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}

        {!loading && departments.length > 0 && sortedTeams.length === 0 && (
          <p className="text-[var(--mist)] text-sm text-center py-12">
            This department has no groups yet — create them under Admin → Groups.
          </p>
        )}

        {!loading && sortedTeams.length > 0 && cards.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">
              No Team Leader reports match these filters.
            </p>
          </div>
        )}

        {sortedTeams.length > 0 &&
          cards.slice(0, visible).map((card) => {
            const slots = sortedTeams.map((t) => card.byTeam[t._id]);
            const rows = fieldRows(slots.filter(Boolean).map((s) => s.latest));

            return (
              <motion.div
                key={card.key}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-4 sm:p-6 mb-5"
              >
                <p className="font-display font-semibold text-[var(--paper)] mb-4">
                  {cardTitle(card.reportType, card.dateKey)}
                </p>

                {/* wide enough for every group; scrolls sideways instead of squeezing */}
                <div className="overflow-x-auto">
                  <div style={{ minWidth: gridStyle.minWidth }}>
                    {/* one column header per group */}
                    <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: gridStyle.gridTemplateColumns }}>
                      {sortedTeams.map((team, i) => {
                        const slot = slots[i];
                        const r = slot?.latest;
                        return (
                          <div
                            key={team._id}
                            className={`rounded-xl border p-3 min-w-0 ${
                              r
                                ? "border-[var(--panel-border)] bg-[var(--ink)]"
                                : "border-dashed border-[var(--panel-border)]"
                            }`}
                          >
                            <p className="font-display font-semibold text-[var(--paper)] text-sm">
                              {team.name}
                            </p>
                            <p className="flex items-center gap-1 text-[10px] font-mono text-[#60A5FA] mt-0.5 truncate">
                              <Crown size={10} className="shrink-0" />
                              {r?.employee?.name || team.teamLead?.name || "No Team Leader"}
                            </p>
                            {r ? (
                              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                <span
                                  className={`text-[9px] font-mono uppercase tracking-wide border rounded-full px-2 py-0.5 ${STATUS_STYLES[r.status]}`}
                                >
                                  {r.status.replace("_", " ")}
                                </span>
                                {r.isEdited && (
                                  <span className="flex items-center gap-1 text-[9px] font-mono uppercase text-[#60A5FA] border border-[#60A5FA]/40 bg-[#60A5FA]/10 rounded-full px-2 py-0.5">
                                    <Pencil size={8} />
                                    edited
                                  </span>
                                )}
                                <span className="text-[9px] font-mono text-[var(--mist)]">
                                  {new Date(r.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {slot.count > 1 && (
                                  <span className="text-[9px] font-mono text-[var(--amber)]">
                                    latest of {slot.count}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-[var(--mist)] italic mt-2">
                                No report submitted
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* one row per field: the label once, then each group's answer under it */}
                    <div className="space-y-3 border-t border-[var(--panel-border)] pt-4">
                      {rows.map((row) => (
                        <div key={row.key}>
                          <p className="text-[10px] font-mono uppercase text-[var(--mist)] mb-1">
                            {row.label}
                          </p>
                          <div className="grid gap-3" style={{ gridTemplateColumns: gridStyle.gridTemplateColumns }}>
                            {slots.map((slot, i) => {
                              const value = slot?.latest?.data?.[row.key];
                              const edited = slot?.latest?.editedFields?.includes(row.key);
                              return (
                                <div key={sortedTeams[i]._id} className="min-w-0 text-sm text-[var(--paper)] break-words">
                                  {typeof value === "string" && value.startsWith("http") ? (
                                    <a
                                      href={value}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--amber)] hover:text-[var(--amber-dim)] underline"
                                    >
                                      View file
                                    </a>
                                  ) : slot && value !== undefined && value !== "" ? (
                                    String(value)
                                  ) : (
                                    <span className="text-[var(--mist)]">—</span>
                                  )}
                                  {edited && (
                                    <span className="text-[#60A5FA] text-[10px] ml-1">(edited)</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {slots.some((s) => s?.latest?.attachment) && (
                        <div className="grid gap-3 pt-1" style={{ gridTemplateColumns: gridStyle.gridTemplateColumns }}>
                          {slots.map((slot, i) => (
                            <div key={sortedTeams[i]._id} className="min-w-0">
                              {slot?.latest?.attachment && (
                                <a
                                  href={slot.latest.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] break-all"
                                >
                                  📎 {slot.latest.attachment.filename}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

        {sortedTeams.length > 0 && cards.length > visible && (
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="w-full h-11 rounded-xl border border-dashed border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium"
          >
            Show more ({cards.length - visible} older)
          </button>
        )}

        {unplaced.length > 0 && (
          <p className="text-[10px] text-[var(--mist)] mt-6">
            {unplaced.length} report{unplaced.length === 1 ? "" : "s"} from Team Leaders who aren't
            in any of these groups aren't shown here (
            {[...new Set(unplaced.map((r) => r.employee?.name))].join(", ")}). Assign them to a
            group under Admin → Groups.
          </p>
        )}
      </div>
    </div>
  );
}