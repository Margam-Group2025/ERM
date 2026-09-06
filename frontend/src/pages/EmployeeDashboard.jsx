import { useState, useEffect, useRef } from "react";
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
  Calendar,
  Paperclip,
} from "lucide-react";

export default function EmployeeDashboard() {
  const [reportType, setReportType] = useState("daily");
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploadingField, setUploadingField] = useState(null); // which field key is currently uploading
  const periodInputRef = useRef(null);

  // what the employee picks depends on reportType:
  // daily -> a specific date, weekly -> a week, monthly -> a month.
  // Defaults to the current period so most days nobody has to touch it.
  const getDefaultPeriod = (type) => {
    const now = new Date();
    if (type === "monthly") {
      return now.toISOString().slice(0, 7); // "YYYY-MM"
    }
    if (type === "weekly") {
      // ISO week string "YYYY-Www"
      const jan4 = new Date(now.getFullYear(), 0, 4);
      const dayDiff = (now - jan4) / 86400000;
      const week = Math.ceil((dayDiff + jan4.getDay() + 1) / 7);
      return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
    }
    return now.toISOString().split("T")[0]; // "YYYY-MM-DD"
  };

  const [period, setPeriod] = useState(getDefaultPeriod("daily"));

  // converts whatever the employee picked into a single reportDate the
  // backend can store (for weekly: the Monday of that week; for monthly:
  // the 1st of that month)
  const periodToReportDate = () => {
    if (reportType === "monthly") {
      return `${period}-01`;
    }
    if (reportType === "weekly") {
      const [yearStr, weekStr] = period.split("-W");
      const year = parseInt(yearStr, 10);
      const week = parseInt(weekStr, 10);
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dow = simple.getDay();
      const monday = new Date(simple);
      if (dow <= 4) monday.setDate(simple.getDate() - dow + 1);
      else monday.setDate(simple.getDate() + 8 - dow);
      return monday.toISOString().split("T")[0];
    }
    return period; // daily — already "YYYY-MM-DD"
  };

  const token = localStorage.getItem("token");
  const department = localStorage.getItem("department");
  const userRole = localStorage.getItem("role"); // "employee" or "teamlead" — determines which template variant to fetch
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
    setPeriod(getDefaultPeriod(reportType));
    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      setTemplate(null);
      setFormData({});
      setSubmitStatus("idle");
      try {
        const res = await fetch(
          `https://erm-3w28.onrender.com/api/templates/active?department=${department}&reportType=${reportType}&role=${userRole}`,
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

  // for "file" type fields: upload immediately on selection, store the
  // resulting URL as the field's value (same as any other field's value)
  const handleFileFieldUpload = async (key, file) => {
    if (!file) return;
    setUploadingField(key);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("https://erm-3w28.onrender.com/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      const result = await res.json();
      if (res.ok) {
        handleFieldChange(key, result.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingField(null);
    }
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
          reportDate: periodToReportDate(),
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

      // if a file was selected, upload it separately and attach it to the
      // report we just created
      if (attachment) {
        const formData = new FormData();
        formData.append("file", attachment);
        await fetch(`https://erm-3w28.onrender.com/api/reports/${data._id}/attachment`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        setAttachment(null);
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
      case "file":
        return (
          <div>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[var(--panel-border)] text-[var(--mist)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors cursor-pointer text-sm">
              {uploadingField === field.key ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Paperclip size={16} />
              )}
              {uploadingField === field.key
                ? "Uploading…"
                : formData[field.key]
                ? "Replace file"
                : "Choose a photo or PDF"}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => handleFileFieldUpload(field.key, e.target.files[0])}
                className="hidden"
                disabled={uploadingField === field.key}
              />
            </label>
            {formData[field.key] && (
              <a
                href={formData[field.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--success)] mt-1 inline-block"
              >
                ✓ File uploaded — view
              </a>
            )}
          </div>
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
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* illustration banner */}
        <div className="relative mb-6 rounded-2xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel)] animate-field-in">
          <svg viewBox="0 0 400 120" className="w-full h-24 sm:h-28" preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="120" fill="var(--panel)" />
            {/* soft amber glow */}
            <circle cx="70" cy="30" r="70" fill="var(--amber)" opacity="0.12" />
            <circle cx="340" cy="100" r="60" fill="#60A5FA" opacity="0.08" />
            {/* ledger rows motif */}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} opacity={0.5 - i * 0.08}>
                <rect x={230 + i * 6} y={20 + i * 18} width="130" height="10" rx="3" fill="var(--mist)" opacity="0.15" />
                <rect x={230 + i * 6} y={20 + i * 18} width="60" height="10" rx="3" fill="var(--amber)" opacity="0.25" />
              </g>
            ))}
            {/* clipboard-check mark */}
            <g transform="translate(40, 35)">
              <rect x="0" y="4" width="48" height="60" rx="6" fill="none" stroke="var(--amber)" strokeWidth="3" />
              <rect x="14" y="0" width="20" height="10" rx="3" fill="var(--amber)" />
              <path d="M12 38 L22 48 L38 26" fill="none" stroke="var(--success)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </svg>
        </div>

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4 animate-field-in">
          <div>
            <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
              <FileText size={14} />
              Employee Dashboard
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1">
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
        <div className="flex gap-2 mb-4 animate-field-in" style={{ animationDelay: "0.05s" }}>
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

        {/* period picker — what "daily/weekly/monthly" actually means for this report */}
        <div className="mb-6 animate-field-in" style={{ animationDelay: "0.08s" }}>
          <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
            {reportType === "daily" && "Report date"}
            {reportType === "weekly" && "Report week"}
            {reportType === "monthly" && "Report month"}
          </label>
          <div
            className="relative flex items-center bg-[var(--panel)] rounded-lg border border-[var(--panel-border)] focus-within:border-[var(--amber)] transition-colors cursor-pointer max-w-xs"
            onClick={() => periodInputRef.current?.showPicker?.()}
          >
            <Calendar size={16} className="absolute left-3 text-[var(--mist)] pointer-events-none" />
            <input
              ref={periodInputRef}
              type={reportType === "daily" ? "date" : reportType === "weekly" ? "week" : "month"}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full bg-transparent text-[var(--paper)] rounded-lg pl-10 pr-3 py-2.5 outline-none cursor-pointer"
            />
          </div>
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

              <div>
                <label className="block font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
                  Attach photo/file (optional)
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[var(--panel-border)] text-[var(--mist)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-colors cursor-pointer text-sm">
                  <Paperclip size={16} />
                  {attachment ? attachment.name : "Choose a photo or PDF (max 5MB)"}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={(e) => setAttachment(e.target.files[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

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