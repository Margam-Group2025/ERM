import {
  useState,
  useEffect } from "react";
import { motion,
  AnimatePresence } from "framer-motion";
import {
  Network,
  Plus,
  Trash2,
  Crown,
  X,
  Loader2,
  AlertCircle,
  UserPlus,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const idOf = (v) => (v && typeof v === "object" ? v._id : v);

export default function CrmGroups() {
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // key of the action currently in flight
  const [newGroupName, setNewGroupName] = useState({}); // departmentId -> text being typed

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [dRes, tRes, uRes] = await Promise.all([
        fetch(`${API}/api/departments`, { headers }),
        fetch(`${API}/api/teams`, { headers }),
        fetch(`${API}/api/users`, { headers }),
      ]);
      const [d, t, u] = await Promise.all([dRes.json(), tRes.json(), uRes.json()]);
      if (dRes.ok) setDepartments(d);
      if (tRes.ok) setTeams(t);
      if (uRes.ok) setUsers(u);
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // every change goes through here: run it, show the server's message if it
  // refuses (e.g. a Team Leader from another department), then reload
  const act = async (key, url, method, body) => {
    setBusy(key);
    setError("");
    try {
      const res = await fetch(`${API}${url}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return false;
      }
      await loadAll(true);
      return true;
    } catch (err) {
      console.error(err);
      setError("Could not reach the server.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const createGroup = async (dept) => {
    const name = (newGroupName[dept._id] || "").trim();
    if (!name) return;
    const ok = await act(`new-${dept._id}`, "/api/teams", "POST", {
      name,
      department: dept._id,
    });
    if (ok) setNewGroupName((p) => ({ ...p, [dept._id]: "" }));
  };

  const usersOf = (deptId) => users.filter((u) => idOf(u.department) === deptId);
  const groupDepts = departments.filter((d) => d.hasGroups);

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Network size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Groups
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Split a department (e.g. CRM) into groups. Each group has its own Team Leader, who
            only sees and reviews that group's reports.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-[var(--error)] text-sm font-medium mb-6 bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-xl p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading…
          </div>
        )}

        {!loading && (
          <>
            {/* which departments use groups */}
            <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 mb-8">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-3">
                Departments with groups
              </p>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="text-[var(--paper)] text-sm">{d.name}</span>
                    <button
                      onClick={() =>
                        act(`dept-${d._id}`, `/api/departments/${d._id}`, "PUT", {
                          hasGroups: !d.hasGroups,
                        })
                      }
                      disabled={busy === `dept-${d._id}`}
                      className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-3 py-1 transition-colors disabled:opacity-60 ${
                        d.hasGroups
                          ? "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10"
                          : "text-[var(--mist)] border-[var(--panel-border)] hover:border-[var(--mist)]"
                      }`}
                    >
                      {busy === `dept-${d._id}` ? "…" : d.hasGroups ? "Groups ON" : "Groups OFF"}
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[var(--mist)] mt-3">
                Departments with groups OFF work exactly as before. Groups can only be switched OFF
                again once all their groups are deleted.
              </p>
            </div>

            {groupDepts.length === 0 && (
              <p className="text-[var(--mist)] text-sm text-center py-8">
                Switch Groups ON for a department (e.g. CRM) to start creating groups.
              </p>
            )}

            {groupDepts.map((dept) => {
              const deptUsers = usersOf(dept._id);
              const deptTeams = teams.filter((t) => idOf(t.department) === dept._id);
              const leaders = deptUsers.filter((u) => u.role === "teamlead");
              const unassignedEmployees = deptUsers.filter(
                (u) => u.role === "employee" && !u.team
              );
              const unassignedLeaders = leaders.filter((u) => !u.team);

              return (
                <div key={dept._id} className="mb-10">
                  <h2 className="font-display text-xl font-semibold text-[var(--paper)] mb-4">
                    {dept.name}
                  </h2>

                  {/* new group */}
                  <div className="flex gap-2 mb-5">
                    <input
                      type="text"
                      placeholder="New group name (e.g. Group 1)"
                      value={newGroupName[dept._id] || ""}
                      onChange={(e) =>
                        setNewGroupName((p) => ({ ...p, [dept._id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && createGroup(dept)}
                      className="flex-1 min-w-0 bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[var(--amber)]"
                    />
                    <button
                      onClick={() => createGroup(dept)}
                      disabled={busy === `new-${dept._id}`}
                      className="flex items-center gap-1.5 px-4 rounded-lg bg-[var(--amber)] hover:bg-[var(--amber-dim)] text-[var(--ink)] text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {busy === `new-${dept._id}` ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Add group
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {deptTeams.map((team) => {
                      const members = deptUsers.filter(
                        (u) => u.role === "employee" && idOf(u.team) === team._id
                      );
                      return (
                        <motion.div
                          key={team._id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 sm:p-6 mb-4"
                        >
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                              <p className="font-display font-semibold text-[var(--paper)]">
                                {team.name}
                              </p>
                              <p className="text-[10px] font-mono text-[var(--mist)] mt-0.5">
                                {members.length} employee{members.length === 1 ? "" : "s"}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                window.confirm(`Delete "${team.name}"?`) &&
                                act(`del-${team._id}`, `/api/teams/${team._id}`, "DELETE")
                              }
                              disabled={busy === `del-${team._id}`}
                              className="text-[var(--mist)] hover:text-[var(--error)] transition-colors disabled:opacity-60"
                              title="Delete group"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* team leader */}
                          <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--mist)] mb-2">
                            <Crown size={11} className="text-[#60A5FA]" />
                            Team Leader
                          </label>
                          <select
                            value={idOf(team.teamLead) || ""}
                            onChange={(e) =>
                              act(`lead-${team._id}`, `/api/teams/${team._id}`, "PUT", {
                                teamLead: e.target.value || null,
                              })
                            }
                            disabled={busy === `lead-${team._id}`}
                            className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)] text-sm mb-5 disabled:opacity-60"
                          >
                            <option value="">— No Team Leader —</option>
                            {leaders.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name} ({u.employeeId})
                                {u.team && idOf(u.team) !== team._id
                                  ? ` — currently leads ${u.team.name}`
                                  : ""}
                              </option>
                            ))}
                          </select>

                          {/* members */}
                          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--mist)] mb-2">
                            Employees
                          </p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {members.length === 0 && (
                              <span className="text-[var(--mist)] text-xs italic">
                                No employees in this group yet.
                              </span>
                            )}
                            {members.map((u) => (
                              <span
                                key={u._id}
                                className="flex items-center gap-1.5 bg-[var(--ink)] border border-[var(--panel-border)] text-[var(--paper)] text-xs rounded-full pl-3 pr-2 py-1"
                              >
                                {u.name}
                                <button
                                  onClick={() =>
                                    act(`rm-${u._id}`, `/api/users/${u._id}`, "PUT", {
                                      team: null,
                                    })
                                  }
                                  disabled={busy === `rm-${u._id}`}
                                  className="text-[var(--mist)] hover:text-[var(--error)] disabled:opacity-60"
                                  title="Remove from group"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <UserPlus size={14} className="text-[var(--mist)] shrink-0" />
                            <select
                              value=""
                              onChange={(e) =>
                                e.target.value &&
                                act(`add-${team._id}`, `/api/users/${e.target.value}`, "PUT", {
                                  team: team._id,
                                })
                              }
                              disabled={busy === `add-${team._id}` || unassignedEmployees.length === 0}
                              className="flex-1 bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)] text-sm disabled:opacity-60"
                            >
                              <option value="">
                                {unassignedEmployees.length === 0
                                  ? "No unassigned employees"
                                  : "Add an employee…"}
                              </option>
                              {unassignedEmployees.map((u) => (
                                <option key={u._id} value={u._id}>
                                  {u.name} ({u.employeeId})
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {deptTeams.length === 0 && (
                    <p className="text-[var(--mist)] text-sm text-center py-4">
                      No groups yet — add the first one above.
                    </p>
                  )}

                  {/* people nobody can review yet */}
                  {(unassignedEmployees.length > 0 || unassignedLeaders.length > 0) && (
                    <div className="flex items-start gap-2 text-xs text-[var(--amber)] bg-[var(--amber)]/10 border border-[var(--amber)]/30 rounded-xl p-3">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium mb-0.5">Not in any group yet</p>
                        <p className="text-[var(--mist)]">
                          No Team Leader can see or review these people until they're in a group:{" "}
                          {[...unassignedLeaders, ...unassignedEmployees]
                            .map((u) => `${u.name}${u.role === "teamlead" ? " (Team Leader)" : ""}`)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}