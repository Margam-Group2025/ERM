import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

const FIELD_TYPES = ["text", "textarea", "number", "date", "select", "checkbox", "file"];

// small helper component: type an option and press Enter (or comma) to add
// it as a chip. Click the × on a chip to remove it. Much clearer for admins
// than typing a raw comma-separated string.
function OptionEditor({ options, onChange }) {
  const [draft, setDraft] = useState("");

  const addOption = () => {
    const trimmed = draft.trim();
    if (trimmed && !options.includes(trimmed)) {
      onChange([...options, trimmed]);
    }
    setDraft("");
  };

  const removeOption = (opt) => {
    onChange(options.filter((o) => o !== opt));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addOption();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((opt) => (
          <span
            key={opt}
            className="flex items-center gap-1.5 bg-[var(--ink)] border border-[var(--panel-border)] text-[var(--paper)] text-xs rounded-full pl-3 pr-2 py-1"
          >
            {opt}
            <button
              type="button"
              onClick={() => removeOption(opt)}
              className="text-[var(--mist)] hover:text-[var(--error)]"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type an option, press Enter to add"
          className="flex-1 bg-transparent text-[var(--paper)] py-1.5 px-1 outline-none border-b border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors text-xs font-mono"
        />
        <button
          type="button"
          onClick={addOption}
          className="text-xs text-[var(--amber)] hover:text-[var(--amber-dim)] font-medium px-2"
        >
          Add
        </button>
      </div>
      {options.length === 0 && (
        <p className="text-[10px] text-[var(--mist)] mt-1">
          No options yet — this dropdown will be empty for employees until you add some.
        </p>
      )}
    </div>
  );
}

export default function TemplateBuilder() {
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState("");
  const [reportType, setReportType] = useState("daily");
  const [role, setRole] = useState("employee");
  const [fields, setFields] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDepartments = async () => {
      const res = await fetch("http://localhost:5000/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDepartments(data);
        if (data.length > 0) setDepartment(data[0]._id);
      }
    };
    fetchDepartments();
  }, []);

  // load an existing template (if any) whenever department/reportType/role changes
  useEffect(() => {
    if (!department) return;
    const loadExisting = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/templates/active?department=${department}&reportType=${reportType}&role=${role}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) {
          setFields(data.fields.map((f) => ({ ...f, _uid: crypto.randomUUID() })));
        } else {
          setFields([]);
        }
      } catch {
        setFields([]);
      }
    };
    loadExisting();
  }, [department, reportType, role]);

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        _uid: crypto.randomUUID(),
        key: "",
        label: "",
        type: "text",
        required: false,
        options: [],
        order: prev.length + 1,
      },
    ]);
  };

  const removeField = (uid) => {
    setFields((prev) => prev.filter((f) => f._uid !== uid));
  };

  const updateField = (uid, key, value) => {
    setFields((prev) =>
      prev.map((f) => (f._uid === uid ? { ...f, [key]: value } : f))
    );
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg("");

    // auto-generate a `key` from the label if the user left it blank
    const preparedFields = fields.map((f, i) => ({
      key: f.key || f.label.trim().toLowerCase().replace(/\s+/g, "_"),
      label: f.label,
      type: f.type,
      required: f.required,
      options: f.type === "select" ? f.options : undefined,
      order: i + 1,
    }));

    try {
      // try create first; if it already exists, fall back to update
      const createRes = await fetch("http://localhost:5000/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ department, reportType, role, fields: preparedFields }),
      });

      if (createRes.status === 400) {
        // template already exists for this department + reportType + role — fetch its id then update
        const existingRes = await fetch(
          `http://localhost:5000/api/templates/active?department=${department}&reportType=${reportType}&role=${role}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const existing = await existingRes.json();

        const updateRes = await fetch(
          `http://localhost:5000/api/templates/${existing._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fields: preparedFields }),
          }
        );
        if (!updateRes.ok) {
          const err = await updateRes.json();
          throw new Error(err.message);
        }
      } else if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message);
      }

      setSaveStatus("success");
    } catch (err) {
      setSaveStatus("error");
      setErrorMsg(err.message || "Failed to save template");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Layers size={14} />
            Admin · Template Builder
          </span>
          <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
            Design a report form
          </h1>
          <p className="text-[var(--mist)] text-sm mt-1">
            Define the fields employees will fill in for this department's report.
          </p>
        </div>

        {/* department + report type selectors */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--paper)] rounded-lg px-4 py-2.5 outline-none focus:border-[var(--amber)] transition-colors"
          >
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map((type) => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                  reportType === type
                    ? "bg-[var(--amber)] text-[var(--ink)]"
                    : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)]"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* which role this form is for — a department can have a
              different report form for Employees vs their Team Lead */}
          <div className="flex gap-2">
            {[
              { key: "employee", label: "Employee form" },
              { key: "teamlead", label: "Team Lead form" },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                  role === r.key
                    ? "bg-[#60A5FA] text-[var(--ink)]"
                    : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* animated field list */}
        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6">
          <AnimatePresence initial={false}>
            {fields.map((field, index) => (
              <motion.div
                key={field._uid}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="flex items-start gap-3 py-3 border-b border-[var(--panel-border)] last:border-b-0"
              >
                <GripVertical
                  size={18}
                  className="text-[var(--mist)] mt-3 shrink-0 cursor-grab"
                />

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3">
                  <input
                    type="text"
                    placeholder="Field label (e.g. Working Hours)"
                    value={field.label}
                    onChange={(e) => updateField(field._uid, "label", e.target.value)}
                    className="bg-transparent text-[var(--paper)] py-2 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors text-sm"
                  />

                  <select
                    value={field.type}
                    onChange={(e) => updateField(field._uid, "type", e.target.value)}
                    className="bg-[var(--ink)] text-[var(--paper)] text-sm rounded-lg px-2 py-2 border border-[var(--panel-border)] outline-none focus:border-[var(--amber)]"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-[var(--mist)] font-mono">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field._uid, "required", e.target.checked)
                        }
                        className="accent-[var(--amber)]"
                      />
                      required
                    </label>
                    <button
                      onClick={() => removeField(field._uid)}
                      className="text-[var(--mist)] hover:text-[var(--error)] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {field.type === "select" && (
                    <div className="col-span-full">
                      <OptionEditor
                        options={field.options || []}
                        onChange={(newOptions) => updateField(field._uid, "options", newOptions)}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {fields.length === 0 && (
            <p className="text-[var(--mist)] text-sm text-center py-8">
              No fields yet — add the first one below.
            </p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={addField}
            className="w-full mt-4 h-11 rounded-xl border border-dashed border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Add field
          </motion.button>
        </div>

        {saveStatus === "error" && (
          <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium mt-4">
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}
        {saveStatus === "success" && (
          <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium mt-4">
            <CheckCircle2 size={16} />
            Template saved.
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saveStatus === "saving" || fields.length === 0}
          className="w-full mt-6 h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saveStatus === "saving" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Save template"
          )}
        </motion.button>
      </div>
    </div>
  );
}