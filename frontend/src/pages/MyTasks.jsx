import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import BackButton from "../components/BackButton";
import {
  ListChecks,
  FileText,
  Loader2,
  Inbox,
  CalendarClock,
  ChevronRight,
} from "lucide-react";

const PRIORITY_STYLES = {
  low: "text-[var(--mist)] border-[var(--panel-border)]",
  medium: "text-[var(--amber)] border-[var(--amber)]/40 bg-[var(--amber)]/10",
  high: "text-[var(--error)] border-[var(--error)]/40 bg-[var(--error)]/10",
};

const STATUS_FLOW = ["not_started", "in_progress", "completed"];
const STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://erm-3w28.onrender.com/api/tasks/mine", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // cycles a task to the next status in the flow (not_started -> in_progress -> completed)
  const advanceStatus = async (task) => {
    const currentIndex = STATUS_FLOW.indexOf(task.status);
    if (currentIndex === STATUS_FLOW.length - 1) return; // already completed
    const nextStatus = STATUS_FLOW[currentIndex + 1];

    setUpdatingId(task._id);
    try {
      const res = await fetch(`https://erm-3w28.onrender.com/api/tasks/${task._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const isOverdue = (deadline, status) =>
    deadline && status !== "completed" && new Date(deadline) < new Date();

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <BackButton to="/dashboard" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <ListChecks size={14} />
              Employee
            </span>
            <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
              My tasks
            </h1>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium shrink-0"
          >
            <FileText size={16} />
            File a report
          </Link>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
            <Loader2 size={16} className="animate-spin" />
            Loading tasks…
          </div>
        )}

        {!loading && tasks.length === 0 && (
          <div className="flex flex-col items-center text-center py-16 gap-3">
            <Inbox size={32} className="text-[var(--mist)]" />
            <p className="text-[var(--mist)] text-sm">No tasks assigned yet.</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task._id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 mb-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="font-display font-semibold text-[var(--paper)]">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[var(--mist)] text-sm mt-1">{task.description}</p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wide border rounded-full px-2.5 py-1 shrink-0 ${PRIORITY_STYLES[task.priority]}`}
                >
                  {task.priority}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--mist)] font-mono mt-3 mb-4">
                <span>Assigned by {task.assignedBy?.name}</span>
                {task.deadline && (
                  <span
                    className={`flex items-center gap-1 ${
                      isOverdue(task.deadline, task.status) ? "text-[var(--error)]" : ""
                    }`}
                  >
                    <CalendarClock size={12} />
                    {new Date(task.deadline).toLocaleDateString()}
                    {isOverdue(task.deadline, task.status) && " · overdue"}
                  </span>
                )}
              </div>

              {/* status progress track */}
              <div className="flex items-center gap-2">
                {STATUS_FLOW.map((s, i) => {
                  const currentIndex = STATUS_FLOW.indexOf(task.status);
                  const reached = i <= currentIndex;
                  return (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                          reached ? "bg-[var(--amber)]" : "bg-[var(--panel-border)]"
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-mono text-[var(--mist)]">
                  {STATUS_LABELS[task.status]}
                </span>

                {task.status !== "completed" && (
                  <button
                    onClick={() => advanceStatus(task)}
                    disabled={updatingId === task._id}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--amber)] hover:text-[var(--amber-dim)] transition-colors disabled:opacity-60"
                  >
                    {updatingId === task._id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        Mark as {STATUS_LABELS[STATUS_FLOW[STATUS_FLOW.indexOf(task.status) + 1]]}
                        <ChevronRight size={12} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}