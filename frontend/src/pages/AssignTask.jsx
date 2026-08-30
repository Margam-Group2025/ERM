import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const PRIORITY_STYLES = {
  low: "border-[var(--panel-border)] text-[var(--mist)]",
  medium: "border-[var(--amber)]/40 text-[var(--amber)]",
  high: "border-[var(--error)]/40 text-[var(--error)]",
};

export default function AssignTask() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    deadline: "",
  });
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");
  const department = localStorage.getItem("department");

  // Team Lead can only assign tasks to people in their own department —
  // fetch users filtered by department so the dropdown only shows valid targets
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/users?department=${department}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) {
          const members = data.filter((u) => u.role === "employee");
          setTeamMembers(members);
          if (members.length > 0) setForm((f) => ({ ...f, assignedTo: members[0]._id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeamMembers();
  }, []);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.message || "Failed to assign task");
        return;
      }

      setStatus("success");
      setForm((f) => ({ ...f, title: "", description: "", deadline: "" }));
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
            <ClipboardPlus size={14} />
            Team Lead
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
            Assign a task
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-8 space-y-5"
        >
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Task title
            </label>
            <input
              type="text"
              required
              placeholder="Fix login validation bug"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Optional details…"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors resize-none text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Assign to
            </label>
            <select
              value={form.assignedTo}
              onChange={(e) => updateField("assignedTo", e.target.value)}
              className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
            >
              {teamMembers.length === 0 && <option value="">No employees found</option>}
              {teamMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Priority
              </label>
              <div className="flex gap-2">
                {["low", "medium", "high"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateField("priority", p)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-mono uppercase transition-colors ${
                      form.priority === p
                        ? PRIORITY_STYLES[p] + " bg-current/10"
                        : "border-[var(--panel-border)] text-[var(--mist)]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => updateField("deadline", e.target.value)}
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
          {status === "success" && (
            <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium">
              <CheckCircle2 size={16} />
              Task assigned successfully.
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={status === "saving" || teamMembers.length === 0}
            className="w-full h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === "saving" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign task"
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}