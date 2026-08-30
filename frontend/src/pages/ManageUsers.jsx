import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Crown,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

const ROLE_STYLES = {
  admin: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  teamlead: "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  employee: "text-[var(--mist)] border-[var(--panel-border)]",
};

export default function ManageUsers() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, userRes] = await Promise.all([
        fetch("http://localhost:5000/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const deptData = await deptRes.json();
      const userData = await userRes.json();
      if (deptRes.ok) setDepartments(deptData);
      if (userRes.ok) setUsers(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // changing someone's role to "teamlead" doesn't automatically demote the
  // existing lead — Admin does that explicitly by changing the old lead's
  // role too, so two people can briefly co-exist if needed (e.g. handover)
  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
        setJustSavedId(userId);
        setTimeout(() => setJustSavedId(null), 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const usersByDepartment = (deptId) =>
    users.filter((u) => u.department?._id === deptId || u.department === deptId);

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Users size={14} />
            Admin
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
            Manage team
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            See who's in each department and change roles, including who leads a team.
          </p>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading team…
          </div>
        )}

        {!loading &&
          departments.map((dept) => {
            const members = usersByDepartment(dept._id);
            const lead = members.find((m) => m.role === "teamlead");

            return (
              <div
                key={dept._id}
                className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 mb-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-semibold text-[var(--paper)] text-lg">
                    {dept.name}
                  </h2>
                  {lead ? (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-[#60A5FA] border border-[#60A5FA]/40 bg-[#60A5FA]/10 rounded-full px-3 py-1">
                      <Crown size={12} />
                      {lead.name}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-[var(--mist)] border border-[var(--panel-border)] rounded-full px-3 py-1">
                      No team lead yet
                    </span>
                  )}
                </div>

                {members.length === 0 && (
                  <p className="text-[var(--mist)] text-sm italic">
                    No employees in this department yet.
                  </p>
                )}

                <div className="space-y-2">
                  {members
                    .filter((m) => m.role !== "admin")
                    .map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between gap-4 py-2.5 border-b border-[var(--panel-border)] last:border-b-0"
                      >
                        <div>
                          <p className="text-[var(--paper)] text-sm font-medium">
                            {member.name}
                          </p>
                          <p className="text-[var(--mist)] text-xs font-mono">
                            {member.employeeId}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {justSavedId === member._id && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-[var(--success)]"
                            >
                              <CheckCircle2 size={16} />
                            </motion.span>
                          )}

                          <div className="relative">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member._id, e.target.value)}
                              disabled={updatingId === member._id}
                              className={`appearance-none text-xs font-mono uppercase tracking-wide border rounded-full pl-3 pr-7 py-1.5 outline-none cursor-pointer transition-colors ${ROLE_STYLES[member.role]}`}
                            >
                              <option value="employee">Employee</option>
                              <option value="teamlead">Team Lead</option>
                            </select>
                            <ChevronDown
                              size={12}
                              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                            />
                          </div>

                          {updatingId === member._id && (
                            <Loader2 size={14} className="animate-spin text-[var(--mist)]" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}