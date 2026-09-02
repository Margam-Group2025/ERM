import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";


export default function BackButton({ to, label = "Back" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="flex items-center gap-1.5 text-sm font-medium text-[var(--mist)] hover:text-[var(--amber)] transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      {label}
    </button>
  );
}