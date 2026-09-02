import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import BackButton from "../components/BackButton";
export default function AddUser() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
  });
  const [status, setStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch("https://erm-3w28.onrender.com/api/departments", {
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

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("https://erm-3w28.onrender.com/api/auth/register", {
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
        setErrorMsg(data.message || "Failed to create user");
        return;
      }

      setStatus("success");
      setForm((f) => ({
        ...f,
        employeeId: "",
        name: "",
        email: "",
        password: "",
      }));
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-md mx-auto">
        <BackButton to="/dashboard" />
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <UserPlus size={14} />
            Admin
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
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
              className="w-full bg-transparent text-var(--paper) py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors"
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

          <div className="grid grid-cols-2 gap-4">
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