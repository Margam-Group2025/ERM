
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Crown,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Pencil,
  X,
  Save,
  Mail,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const ROLE_STYLES = {
  admin:
    "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  teamlead:
    "text-[#60A5FA] border-[#60A5FA]/40 bg-[#60A5FA]/10",
  employee:
    "text-[var(--mist)] border-[var(--panel-border)]",
};

export default function ManageUsers() {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);

    try {
      const [deptRes, userRes] = await Promise.all([
        fetch(`${API}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const deptData = await deptRes.json();
      const userData = await userRes.json();

      if (!deptRes.ok) {
        throw new Error(deptData.message || "Could not load departments");
      }

      if (!userRes.ok) {
        throw new Error(userData.message || "Could not load users");
      }

      setDepartments(deptData);
      setUsers(userData);
    } catch (err) {
      console.error("Manage team loading error:", err);
      window.alert(err.message || "Failed to load team data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshUsers = async () => {
    const res = await fetch(`${API}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Could not refresh users");
    }

    setUsers(data);
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);

    try {
      const res = await fetch(`${API}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        window.alert(data.message || "Role update failed");
        return;
      }

      await refreshUsers();

      setJustSavedId(userId);
      setTimeout(() => setJustSavedId(null), 1500);
    } catch (err) {
      console.error("Role update error:", err);
      window.alert(err.message || "Could not update role.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditClick = (member) => {
    setEditingUser(member._id);
    setEditForm({
      name: member.name || "",
      email: member.email || "",
    });
  };

  const handleEditCancel = () => {
    if (savingEdit) return;

    setEditingUser(null);
    setEditForm({ name: "", email: "" });
  };

  const handleEditSave = async (userId) => {
    const name = editForm.name.trim();
    const email = editForm.email.trim().toLowerCase();

    if (!name) {
      window.alert("Name is required.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      window.alert("Please enter a valid email address.");
      return;
    }

    setSavingEdit(true);

    try {
      const res = await fetch(`${API}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        window.alert(data.message || "Could not update user.");
        return;
      }

      await refreshUsers();

      setEditingUser(null);
      setEditForm({ name: "", email: "" });
      setJustSavedId(userId);
      setTimeout(() => setJustSavedId(null), 1500);
    } catch (err) {
      console.error("User edit error:", err);
      window.alert(err.message || "Something went wrong while updating.");
    } finally {
      setSavingEdit(false);
    }
  };

  const usersByDepartment = (deptId) =>
    users.filter(
      (user) =>
        user.department?._id === deptId ||
        user.department === deptId
    );

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-4xl">
        {/* Page heading */}
        <div className="mb-8">
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--amber)]">
            <Users size={14} />
            Admin
          </span>

          <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--paper)] sm:text-3xl">
            Manage team
          </h1>

          <p className="mt-1 text-sm text-[var(--mist)]">
            Manage employee details, add email addresses, and change roles.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-2 font-mono text-sm text-[var(--mist)]">
            <Loader2 size={16} className="animate-spin" />
            Loading team...
          </div>
        )}

        {/* Empty state */}
        {!loading && departments.length === 0 && (
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-6 text-sm text-[var(--mist)]">
            No departments found.
          </div>
        )}

        {/* Admin users without department */}
{!loading && users.filter((user) => user.role === "admin").length > 0 && (
  <section className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 sm:p-6">
    <h2 className="mb-4 font-display text-lg font-semibold text-[var(--paper)]">
      Admin Users
    </h2>

    {users
      .filter((user) => user.role === "admin")
      .map((member) => {
        const isEditing = editingUser === member._id;

        return (
          <div
            key={member._id}
            className="flex flex-col gap-3 border-b border-[var(--panel-border)] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <div className="max-w-lg space-y-3">
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    placeholder="Admin name"
                    className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)]"
                  />

                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    placeholder="Admin email"
                    className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)]"
                  />
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-[var(--paper)]">
                    {member.name}
                  </p>
                  <p className="mt-1 break-all text-xs text-[var(--mist)]">
                    {member.email || "Email not added"}
                  </p>
                </>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditSave(member._id)}
                  disabled={savingEdit}
                  className="rounded-full bg-[var(--amber)] px-3 py-2 text-xs font-semibold text-[var(--ink)]"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={savingEdit}
                  className="rounded-full border border-[var(--panel-border)] px-3 py-2 text-xs text-[var(--paper)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEditClick(member)}
                disabled={Boolean(editingUser)}
                className="flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] px-3 py-2 text-xs text-[var(--paper)] hover:border-[var(--amber)]"
              >
                <Pencil size={13} />
                Edit Email
              </button>
            )}
          </div>
        );
      })}
  </section>
)}

        {/* Department cards */}
        {!loading &&
          departments.map((dept) => {
            const members = usersByDepartment(dept._id);
            const lead = members.find((member) => member.role === "teamlead");

            return (
              <section
                key={dept._id}
                className="mb-5 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel)] p-4 sm:p-6"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-display text-lg font-semibold text-[var(--paper)]">
                    {dept.name}
                  </h2>

                  {lead ? (
                    <span className="flex w-fit items-center gap-1.5 rounded-full border border-[#60A5FA]/40 bg-[#60A5FA]/10 px-3 py-1 text-xs font-mono text-[#60A5FA]">
                      <Crown size={12} />
                      {lead.name}
                    </span>
                  ) : (
                    <span className="w-fit rounded-full border border-[var(--panel-border)] px-3 py-1 text-xs font-mono text-[var(--mist)]">
                      No team lead yet
                    </span>
                  )}
                </div>

                {members.length === 0 && (
                  <p className="text-sm italic text-[var(--mist)]">
                    No users in this department yet.
                  </p>
                )}

                <div className="space-y-3">
                  {/* {members
                    .filter((member) => member.role !== "admin") */}
                    {members.map((member) => {
                      const isEditing = editingUser === member._id;
                      const isUpdating = updatingId === member._id;

                      return (
                        <div
                          key={member._id}
                          className="flex flex-col gap-4 border-b border-[var(--panel-border)] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          {/* User details / edit form */}
                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div className="max-w-lg space-y-3">
                                <label className="block">
                                  <span className="mb-1 block text-xs text-[var(--mist)]">
                                    Full name
                                  </span>
                                  <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={(event) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                      }))
                                    }
                                    placeholder="Enter full name"
                                    disabled={savingEdit}
                                    className="w-full rounded-lg border border-[var(--panel-border)] bg-[var(--ink)] px-3 py-2 text-sm text-[var(--paper)] outline-none focus:border-[var(--amber)] disabled:opacity-60"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-xs text-[var(--mist)]">
                                    Email address
                                  </span>
                                  <div className="flex items-center gap-2 rounded-lg border border-[var(--panel-border)] bg-[var(--ink)] px-3 focus-within:border-[var(--amber)]">
                                    <Mail
                                      size={15}
                                      className="shrink-0 text-[var(--mist)]"
                                    />
                                    <input
                                      type="email"
                                      value={editForm.email}
                                      onChange={(event) =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          email: event.target.value,
                                        }))
                                      }
                                      placeholder="employee@example.com"
                                      disabled={savingEdit}
                                      className="w-full min-w-0 bg-transparent py-2 text-sm text-[var(--paper)] outline-none disabled:opacity-60"
                                    />
                                  </div>
                                </label>
                              </div>
                            ) : (
                              <>
                                <p className="break-words text-sm font-medium text-[var(--paper)]">
                                  {member.name}
                                </p>

                                <p className="mt-1 break-words font-mono text-xs text-[var(--mist)]">
                                  {member.employeeId}
                                  {member.team?.name && ` · ${member.team.name}`}
                                </p>

                                <p className="mt-1 flex items-start gap-1.5 break-all text-xs text-[var(--mist)]">
                                  <Mail size={13} className="mt-0.5 shrink-0" />
                                  {member.email || "Email not added yet"}
                                </p>

                                {dept.hasGroups && !member.team && (
                                  <p className="mt-1 text-xs text-[var(--error)]">
                                    No group assigned
                                  </p>
                                )}
                              </>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {justSavedId === member._id && !isEditing && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-[var(--success)]"
                                title="Saved successfully"
                              >
                                <CheckCircle2 size={17} />
                              </motion.span>
                            )}

                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditSave(member._id)}
                                  disabled={savingEdit}
                                  className="flex items-center gap-1.5 rounded-full bg-[var(--amber)] px-3 py-2 text-xs font-semibold text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {savingEdit ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Save size={14} />
                                  )}
                                  {savingEdit ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={handleEditCancel}
                                  disabled={savingEdit}
                                  className="flex items-center gap-1 rounded-full border border-[var(--panel-border)] px-3 py-2 text-xs text-[var(--mist)] hover:text-[var(--paper)] disabled:opacity-50"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEditClick(member)}
                                  disabled={Boolean(editingUser) || isUpdating}
                                  className="flex items-center gap-1.5 rounded-full border border-[var(--panel-border)] px-3 py-2 text-xs text-[var(--paper)] transition-colors hover:border-[var(--amber)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Pencil size={13} />
                                  Edit
                                </button>

                                {/* <div className="relative">
                                  <select
                                    value={member.role}
                                    onChange={(event) =>
                                      handleRoleChange(
                                        member._id,
                                        event.target.value
                                      )
                                    }
                                    disabled={Boolean(editingUser) || isUpdating}
                                    className={`appearance-none rounded-full border py-2 pl-3 pr-7 text-xs font-mono uppercase tracking-wide outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ROLE_STYLES[member.role]}`}
                                  >
                                    <option value="employee">Employee</option>
                                    <option value="teamlead">Team Lead</option>
                                  </select>

                                  <ChevronDown
                                    size={12}
                                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60"
                                  />
                                </div> */}
                                {member.role !== "admin" && (
                                  <div className="relative">
                                   <select
                                     value={member.role}
                                     onChange={(event) =>
                                     handleRoleChange(member._id, event.target.value)
                                   }
                                     disabled={Boolean(editingUser) || isUpdating}
                                      className={`appearance-none rounded-full border py-2 pl-3 pr-7 text-xs font-mono uppercase tracking-wide outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ROLE_STYLES[member.role]}`}
                                     >
                                   <option value="employee">Employee</option>
                                   <option value="teamlead">Team Lead</option>
                                   </select>

                                   <ChevronDown
                                    size={12}
                                   className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-60"
                                    />
                               </div>
                                 )}

                                {isUpdating && (
                                  <Loader2
                                    size={14}
                                    className="animate-spin text-[var(--mist)]"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}