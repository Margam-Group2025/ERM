import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Save,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Inbox,
  ListChecks,
} from "lucide-react";

export default function EmployeeDashboard() {
  const [reportType, setReportType] = useState("daily");
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");
  const department = localStorage.getItem("department");
  const [departmentName, setDepartmentName] = useState("");

  // department id alone isn't human-readable — fetch the department list once
  // and look up the matching name to show in the header
  useEffect(() => {
    const fetchDepartmentName = async () => {
      try {
        const res = await fetch("https://erm-3w28.onrender.com/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const match = data.find((d) => d._id === department);
          setDepartmentName(match ? match.name : "");
        }
      } catch {
        setDepartmentName("");
      }
    };
    if (department) fetchDepartmentName();
  }, []);

  useEffect(() => {
    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      setTemplate(null);
      setFormData({});
      setSubmitStatus("idle");
      try {
        const res = await fetch(
          `https://erm-3w28.onrender.com/api/templates/active?department=${department}&reportType=${reportType}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) {
          setTemplate(data);
          const initial = {};
          data.fields.forEach((f) => (initial[f.key] = f.type === "checkbox" ? false : ""));
          setFormData(initial);
        } else {
          setTemplate(null);
        }
      } catch {
        setTemplate(null);
      } finally {
        setLoadingTemplate(false);
      }
    };
    fetchTemplate();
  }, [reportType]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (status) => {
    setSubmitStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch("https://erm-3w28.onrender.com/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportType,
          reportDate: new Date().toISOString().split("T")[0],
          data: formData,
          status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitStatus("error");
        setErrorMsg(data.message || "Something went wrong");
        return;
      }
      setSubmitStatus("success");
    } catch (err) {
      console.error(err);
      setSubmitStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  const renderField = (field) => {
    const commonClasses =
      "w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors duration-300";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            rows={3}
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses + " resize-none"}
          />
        );
      case "select":
        return (
          <select
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses + " bg-[var(--panel)]"}
          >
            <option value="">Select…</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={!!formData[field.key]}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="w-5 h-5 accent-[var(--amber)]"
          />
        );
      case "number":
        return (
          <input
            type="number"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
      case "date":
        return (
          <input
            type="date"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
      default:
        return (
          <input
            type="text"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ink)] p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4 animate-field-in">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <FileText size={14} />
              Employee Dashboard
            </span>
            <h1 className="font-display text-3xl font-semibold text-[var(--paper)] mt-1">
              File a report
            </h1>
            {departmentName && (
              <span className="inline-block mt-2 text-xs font-mono text-[var(--mist)] border border-[var(--panel-border)] rounded-full px-3 py-1">
                {departmentName}
              </span>
            )}
          </div>

          <Link
            to="/tasks"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--amber)] hover:border-[var(--amber)] transition-colors text-sm font-medium shrink-0"
          >
            <ListChecks size={16} />
            My tasks
          </Link>
        </div>

        {/* report type tabs */}
        <div className="flex gap-2 mb-6 animate-field-in" style={{ animationDelay: "0.05s" }}>
          {["daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`relative px-4 py-2 rounded-lg font-mono text-xs uppercase tracking-wide transition-all duration-200 ${
                reportType === type
                  ? "bg-[var(--amber)] text-[var(--ink)] scale-[1.03]"
                  : "bg-[var(--panel)] text-[var(--mist)] border border-[var(--panel-border)] hover:border-[var(--mist)]"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-8 transition-all duration-300">
          {loadingTemplate && (
            <div className="flex items-center gap-2 text-[var(--mist)] font-mono text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading form…
            </div>
          )}

          {!loadingTemplate && !template && (
            <div className="flex flex-col items-center text-center py-10 gap-3 animate-field-in">
              <Inbox size={32} className="text-[var(--mist)]" />
              <p className="text-[var(--mist)] text-sm max-w-xs">
                No {reportType} report template has been set up for your department yet.
                Contact your Admin.
              </p>
            </div>
          )}

          {!loadingTemplate && template && (
            <div className="space-y-5">
              {template.fields
                .sort((a, b) => a.order - b.order)
                .map((field, i) => (
                  <div
                    key={field.key}
                    className="animate-field-in"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                      {field.label}
                      {field.required && <span className="text-[var(--amber)]"> *</span>}
                    </label>
                    {renderField(field)}
                  </div>
                ))}

              {submitStatus === "error" && (
                <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium animate-field-in">
                  <AlertCircle size={16} />
                  {errorMsg}
                </div>
              )}
              {submitStatus === "success" && (
                <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium animate-field-in">
                  <CheckCircle2 size={16} />
                  Report saved successfully.
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleSubmit("draft")}
                  disabled={submitStatus === "saving"}
                  className="flex-1 h-11 rounded-xl border border-[var(--panel-border)] text-[var(--mist)] hover:text-[var(--paper)] hover:border-[var(--mist)] transition-colors duration-200 font-medium disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save draft
                </button>
                <button
                  onClick={() => handleSubmit("submitted")}
                  disabled={submitStatus === "saving"}
                  className="flex-1 h-11 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] active:scale-[0.98] transition-all duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitStatus === "saving" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit report
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}