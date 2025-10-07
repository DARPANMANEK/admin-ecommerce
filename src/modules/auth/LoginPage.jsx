import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "./AuthContext.jsx";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin, isAuthenticated } = useAuth();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (values) => {
    setServerError("");
    try {
      const res = await signin(values.email, values.password);
      if (res?.userRegistered === false) {
        setServerError("Account not found. Please register first.");
        return;
      }
      const from = location.state?.from?.pathname || "/admin";
      navigate(from, { replace: true });
    } catch (e) {
      setServerError("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        background: "#101922",
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#e5e7eb",
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "#ffffff",
            }}
          />
          <span>Admin Panel</span>
        </div>
      </div>
      <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{
            width: 520,
            marginTop: 80,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 10,
            padding: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <h1
              style={{
                color: "#e5e7eb",
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              Welcome back
            </h1>
            <div style={{ color: "#9ca3af", marginTop: 6, fontSize: 14 }}>
              Sign in to continue to your dashboard.
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 12 }}>
                Email address
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                style={{
                  height: 44,
                  padding: "0 12px",
                  color: "#e5e7eb",
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
              {errors.email && (
                <div style={{ color: "#ef4444", fontSize: 12 }}>
                  {errors.email.message}
                </div>
              )}
            </label>

            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Password</span>
              <input
                type="password"
                placeholder="••••••••"
                {...register("password")}
                style={{
                  height: 44,
                  padding: "0 12px",
                  color: "#e5e7eb",
                  background: "#0f172a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  outline: "none",
                }}
              />
              {errors.password && (
                <div style={{ color: "#ef4444", fontSize: 12 }}>
                  {errors.password.message}
                </div>
              )}
            </label>

            {serverError && (
              <div style={{ color: "#ef4444", fontSize: 13 }}>
                {serverError}
              </div>
            )}

            {/* removed reset password link as requested */}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: 44,
                background: "#1d4ed8",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                cursor: "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Logging in…" : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
