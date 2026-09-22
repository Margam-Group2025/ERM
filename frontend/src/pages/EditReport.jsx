import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

export default function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | success | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`${API}/api/reports/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.message || "Could not load this report");
          return;
        }
        setReport(data);
        setFormData(data.data || {});
      } catch (err) {
        console.error(err);
        setLoadError("Could not reach the server.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      const res = await fetch(`${API}/api/reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: formData }),
      });
      const result = await res.json();
      if (!res.ok) {
        setSaveStatus("error");
        setErrorMsg(result.message || "Failed to save changes");
        return;
      }
      setSaveStatus("success");
      setReport(result);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  };

  const renderField = (field) => {
    const wasEdited = report?.editedFields?.includes(field.key);
    const commonClasses =
      "w-full bg-transparent text-[var(--paper)] py-2.5 px-1 outline-none border-b-2 border-[var(--panel-border)] focus:border-[var(--amber)] transition-colors";

    let input;
    switch (field.type) {
      case "textarea":
        input = (
          <textarea
            rows={3}
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses + " resize-none"}
          />
        );
        break;
      case "select":
        input = (
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
        break;
      case "checkbox":
        input = (
          <input
            type="checkbox"
            checked={!!formData[field.key]}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="w-5 h-5 accent-[var(--amber)]"
          />
        );
        break;
      case "number":
        input = (
          <input
            type="number"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
        break;
      case "date":
        input = (
          <input
            type="date"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
        break;
      default:
        input = (
          <input
            type="text"
            value={formData[field.key] || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={commonClasses}
          />
        );
    }

    return (
      <div key={field.key}>
        <label className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--mist)] mb-2">
          {field.label}
          {field.required && <span className="text-[var(--amber)]">*</span>}
          {wasEdited && (
            <span className="flex items-center gap-1 text-[10px] normal-case text-[#60A5FA] border border-[#60A5FA]/40 bg-[#60A5FA]/10 rounded-full px-2 py-0.5">
              <Pencil size={9} />
              edited
            </span>
          )}
        </label>
        {input}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--ink)] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[var(--mist)]" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--ink)] flex flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertCircle size={28} className="text-[var(--error)]" />
        <p className="text-[var(--paper)]">{loadError}</p>
        <Link to="/" className="text-[var(--amber)] text-sm">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--ink)] p-4 sm:p-6 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--mist)] hover:text-[var(--amber)] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mb-8">
          <span className="font-mono text-xs tracking-widest text-[var(--amber)] uppercase flex items-center gap-2">
            <Pencil size={14} />
            Edit report
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[var(--paper)] mt-1 capitalize">
            {report.reportType} report
          </h1>
          <p className="text-[var(--mist)] text-xs font-mono mt-1">
            Period: {new Date(report.reportDate).toLocaleDateString()} · Editable only today
          </p>
        </div>

        <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-2xl p-6 sm:p-8 space-y-5">
          {report.reportTemplate?.fields
            ?.sort((a, b) => a.order - b.order)
            .map((field) => renderField(field))}

          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-[var(--error)] text-sm font-medium">
              <AlertCircle size={16} />
              {errorMsg}
            </div>
          )}
          {saveStatus === "success" && (
            <div className="flex items-center gap-2 text-[var(--success)] text-sm font-medium">
              <CheckCircle2 size={16} />
              Changes saved.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="w-full h-12 rounded-xl bg-[var(--amber)] hover:bg-[var(--amber-dim)] transition-colors duration-200 font-display font-semibold text-[var(--ink)] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={18} />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}