import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API = import.meta.env.VITE_API_URL;
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AddUser() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
    team: "",
  });
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch(`${API}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
        if (data.length > 0) setForm((f) => ({ ...f, department: data[0]._id }));
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      const res = await fetch(`${API}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTeams(data);
    };
    fetchTeams();
  }, []);

  // a group belongs to one department, so reset it when the department changes
  useEffect(() => {
    setForm((f) => ({ ...f, team: "" }));
  }, [form.department]);

  const selectedDept = departments.find((d) => d._id === form.department);
  const showGroup = !!selectedDept?.hasGroups;
  const deptTeams = teams.filter((t) => (t.department?._id || t.department) === form.department);
  const chosenTeam = teams.find((t) => t._id === form.team);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // an employee's group is set when the account is created; a Team
        // Leader is attached to the group right after (below)
        body: JSON.stringify({
          ...form,
          team: form.role === "employee" && showGroup && form.team ? form.team : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.message || "Failed to create user");
        return;
      }

      // Team Leader chosen for a group: make them that group's leader
      if (form.role === "teamlead" && showGroup && form.team) {
        const leadRes = await fetch(`${API}/api/teams/${form.team}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ teamLead: data._id }),
        });
        if (!leadRes.ok) {
          const err = await leadRes.json();
          setStatus("error");
          setErrorMsg(`User created, but group assignment failed: ${err.message}`);
          return;
        }
      }

      setStatus("success");
      setForm((f) => ({
        ...f,
        employeeId: "",
        name: "",
        email: "",
        password: "",
        team: "",
      }));
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <UserPlus size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Add a user
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Create an Employee or Team Lead account.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-8 space-y-5"
        >
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Employee ID
            </label>
            <input
              type="text"
              required
              placeholder="EMP007"
              value={form.employeeId}
              onChange={(e) => updateField("employeeId", e.target.value)}
              className="w-full bg-transparent font-mono text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Full name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Temporary password
            </label>
            <input
              type="text"
              required
              placeholder="emp123"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => updateField("role", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              >
                <option value="employee">Employee</option>
                <option value="teamlead">Team Lead</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Department
              </label>
              <select
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showGroup && form.role !== "admin" && (
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Group
              </label>
              <select
                value={form.team}
                onChange={(e) => updateField("team", e.target.value)}
                className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
              >
                <option value="">— No group yet —</option>
                {deptTeams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[var(--mist)] mt-1.5">
                {form.role === "teamlead"
                  ? chosenTeam?.teamLead
                    ? `This will replace ${chosenTeam.teamLead.name} as the group's Team Leader.`
                    : "They will become this group's Team Leader."
                  : "Employees without a group can't be reviewed by any Team Leader."}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium">
              <CheckCircle2 size={16} />
              User created successfully.
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={status === "saving"}
            className="w-full h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === "saving" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create user"
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}