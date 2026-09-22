import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Inbox,
  CalendarClock,
} from "lucide-react";

const PRIORITY_STYLES = {
  low: "border-[var(--panel-border)] text-[var(--mist)]",
  medium: "border-[var(--amber)]/40 text-[var(--amber)]",
  high: "border-[var(--error)]/40 text-[var(--error)]",
};

const STATUS_STYLES = {
  not_started: "text-[var(--mist)] border-[var(--panel-border)]",
  in_progress: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  completed: "text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10",
};
const STATUS_LABELS = { not_started: "Not started", in_progress: "In progress", completed: "Completed" };

export default function AdminTasks() {
  const [teamLeads, setTeamLeads] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    deadline: "",
  });
  const [saveStatus, setSaveStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTeamLeads = async () => {
      const res = await fetch("https://erm-3w28.onrender.com/api/users?role=teamlead", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTeamLeads(data);
        if (data.length > 0) setForm((f) => ({ ...f, assignedTo: data[0]._id }));
      }
    };
    fetchTeamLeads();
  }, []);

  const fetchTasks = async () => {
    setLoadingTasks(true);
    try {
      const res = await fetch(
        "https://erm-3w28.onrender.com/api/tasks/team?assignedToRole=teamlead",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("https://erm-3w28.onrender.com/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveStatus("error");
        setErrorMsg(data.message || "Failed to assign task");
        return;
      }

      setSaveStatus("success");
      setForm((f) => ({ ...f, title: "", description: "", deadline: "" }));
      fetchTasks(); // refresh the list below with the newly created task
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <ClipboardPlus size={14} />
            Admin
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
            Assign tasks to Team Leads
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 sm:p-8 space-y-5 mb-10"
        >
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
              Task title
            </label>
            <input
              type="text"
              required
              placeholder="Prepare Q3 department review"
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
              Assign to (Team Lead)
            </label>
            <select
              value={form.assignedTo}
              onChange={(e) => updateField("assignedTo", e.target.value)}
              className="w-full bg-[var(--ink)] text-[var(--paper)] rounded-lg px-3 py-2.5 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
            >
              {teamLeads.length === 0 && <option value="">No team leads found</option>}
              {teamLeads.map((tl) => (
                <option key={tl._id} value={tl._id}>
                  {tl.name} ({tl.employeeId}) — {tl.department?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium">
              <CheckCircle2 size={16} />
              Task assigned.
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={saveStatus === "saving" || teamLeads.length === 0}
            className="w-full h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign task"
            )}
          </motion.button>
        </form>

        {/* completion tracking */}
        <h2 className="font-display text-xl font-semibold text-[var(--paper)] mb-4">
          Tracking completion
        </h2>

        {loadingTasks && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading tasks…
          </div>
        )}

        {!loadingTasks && tasks.length === 0 && (
          <div className="flex flex-col items-center text-center py-12 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">No tasks assigned to any Team Lead yet.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task._id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-5 mb-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)]">
                    {task.title}
                  </p>
                  <p className="text-[var(--mist)] text-xs font-mono mt-0.5">
                    {task.assignedTo?.name} ({task.assignedTo?.employeeId}) ·{" "}
                    {task.department?.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 ${PRIORITY_STYLES[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </div>
              {task.deadline && (
                <p className="flex items-center gap-1 text-xs text-[var(--mist)] font-mono mt-2">
                  <CalendarClock size={12} />
                  {new Date(task.deadline).toLocaleDateString()}
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}