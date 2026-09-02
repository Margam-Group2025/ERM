import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle"
import {
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("https://erm-3w28.onrender.com/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.message || "Invalid Employee ID or password");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("department", data.department || "");
      setStatus("success");

      const destination =
        data.role === "admin"
          ? "/admin"
          : data.role === "teamlead"
          ? "/teamlead"
          : "/dashboard";

      setTimeout(() => {
        navigate(destination);
      }, 500);
    } catch (err) {
      console.error("Login Error:", err);

      setStatus("error");
      setErrorMsg(
        "Unable to connect to the server. Please check if the backend is running."
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--ink) text-(--paper)">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-(--amber)/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-(--amber)/10 blur-3xl" />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03] background-image: linear-gradient(var(--paper) 1px,transparent 1px),linear-gradient(90deg,var(--paper) 1px,transparent 1px)" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* ================= LEFT SIDE ================= */}

        <div className="relative hidden overflow-hidden border-r border-(--panel-border) lg:flex lg:flex-col lg:justify-between p-8 xl:p-14">
          {/* Top Brand */}
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-(--panel-border) bg-(--panel)/50 px-4 py-2 backdrop-blur-md">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--amber) opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-(--amber)" />
              </div>

              <span className="font-mono text-xs font-medium tracking-[0.2em] text-(--mist) uppercase">
                Margam Group
              </span>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-xl">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-(--amber)/30 bg-(--amber)/10">
              <ShieldCheck
                size={32}
                className="text-(--amber)"
              />
            </div>

            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-(--paper) xl:text-7xl">
              Every report.
              <br />
              <span className="text-(--amber)">One system.</span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-(--mist) xl:text-lg">
              Manage daily, weekly, and monthly employee reports from one
              secure workspace.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-(--panel-border) bg-(--panel)/40 p-4 backdrop-blur-sm">
                <p className="font-mono text-xl font-semibold text-(--paper)">
                  03
                </p>
                <p className="mt-1 text-xs text-(--mist)">
                  Departments
                </p>
              </div>

              <div className="rounded-2xl border border-(--panel-border) bg-(--panel)/40 p-4 backdrop-blur-sm">
                <p className="font-mono text-xl font-semibold text-(--paper)">
                  03
                </p>
                <p className="mt-1 text-xs text-(--mist)">
                  User Roles
                </p>
              </div>

              <div className="rounded-2xl border border-(--panel-border) bg-(--panel)/40 p-4 backdrop-blur-sm">
                <p className="font-mono text-xl font-semibold text-(--paper)">
                  100%
                </p>
                <p className="mt-1 text-xs text-(--mist)">
                  Secure Access
                </p>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-6 font-mono text-[10px] tracking-wider text-(--mist) uppercase xl:text-xs">
            <span>Role-Based Access</span>
            <span className="h-1 w-1 rounded-full bg-(--amber)" />
            <span>Report Tracking</span>
            <span className="h-1 w-1 rounded-full bg-(--amber)" />
            <span>Excel Export</span>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}

        <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Brand */}
            <div className="mb-10 text-center lg:hidden">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-(--amber)/30 bg-(--amber)/10">
                <ShieldCheck
                  size={28}
                  className="text-(--amber)"
                />
              </div>

              <p className="font-mono text-xs tracking-[0.2em] text-(--amber) uppercase">
                Margam Group
              </p>

              <h1 className="mt-2 text-3xl font-semibold text-(--paper)">
                Report System
              </h1>

              <p className="mt-2 text-sm text-(--mist)">
                Secure employee workspace
              </p>
            </div>
            <ThemeToggle />
            {/* Login Card */}
            <div className="relative overflow-hidden rounded-3xl border border-(--panel-border) bg-(--panel)/80 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              {/* Card glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-(--amber)/10 blur-3xl" />

              <div className="relative">
                {/* Header */}
                <div className="mb-8">
                  <p className="font-mono text-xs tracking-[0.18em] text-(--amber) uppercase">
                    Welcome back
                  </p>

                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-(--paper)">
                    Sign in to your account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-(--mist)">
                    Enter your credentials to access the Employee Report
                    Management System.
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Employee ID */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-(--paper)">
                      Employee ID
                    </label>

                    <div className="group relative">
                      <UserRound
                        size={19}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--mist) transition-colors group-focus-within:text-(--amber)"
                      />

                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) =>
                          setEmployeeId(e.target.value)
                        }
                        placeholder="Enter Employee ID"
                        required
                        disabled={status === "loading"}
                        className="h-14 w-full rounded-xl border border-(--panel-border) bg-(--ink)/30 py-3 pl-12 pr-4 text-(--paper) outline-none transition-all placeholder:text-(--mist)/50 focus:border-(--amber) focus:ring-4 focus:ring-(--amber)/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-(--paper)">
                        Password
                      </label>
                    </div>

                    <div className="group relative">
                      <LockKeyhole
                        size={19}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--mist) transition-colors group-focus-within:text-(--amber)"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        placeholder="Enter your password"
                        required
                        disabled={status === "loading"}
                        className="h-14 w-full rounded-xl border border-(--panel-border) bg-(--ink)/30 py-3 pl-12 pr-14 text-(--paper) outline-none transition-all placeholder:text-(--mist)/50 focus:border-(--amber) focus:ring-4 focus:ring-(--amber)/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      {/* Show / Hide Password */}
                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        disabled={status === "loading"}
                        className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-(--mist) transition-all hover:bg-(--amber)/10 hover:text-(--amber) disabled:cursor-not-allowed"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {status === "error" && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="group flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-(--amber) px-5 font-semibold text-(--ink) transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-(--amber)/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {status === "loading" ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />
                        Verifying...
                      </>
                    ) : status === "success" ? (
                      <>
                        <ShieldCheck size={20} />
                        Login Successful
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight
                          size={19}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Security text */}
                <div className="mt-6 flex items-center justify-center gap-2 text-center">
                  <ShieldCheck
                    size={15}
                    className="text-(--amber)"
                  />

                  <p className="text-xs text-(--mist)">
                    Secure role-based access system
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-(--mist)">
              © 2026 Margam Group · Employee Report Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}