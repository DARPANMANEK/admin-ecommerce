import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export function AdminLayout() {
  const { signout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        minHeight: "100dvh",
        background: "#0b121b",
      }}
    >
      <aside
        style={{
          background: "#0e1624",
          color: "#cbd5e1",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          padding: 16,
        }}
      >
        <Link
          to="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            color: "#e5e7eb",
            textDecoration: "none",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              background: "#fff",
              borderRadius: 4,
            }}
          />
          <span>Admin Panel</span>
        </Link>
        <nav style={{ display: "grid", gap: 6 }}>
          {[
            { to: "/admin", label: "Dashboard" },
            { to: "/admin/categories", label: "Categories" },
            { to: "/admin/products", label: "Products" },
            { to: "/admin/orders", label: "Orders" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              style={({ isActive }) => ({
                padding: "10px 12px",
                borderRadius: 8,
                color: isActive ? "#e5e7eb" : "#94a3b8",
                background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                textDecoration: "none",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div
        style={{
          display: "grid",
          gridTemplateRows: "64px 1fr",
          minHeight: "100vh",
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
            padding: "0 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "#0b121b",
          }}
        >
          <button
            onClick={handleSignOut}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              height: 36,
              borderRadius: 8,
              padding: "0 12px",
            }}
          >
            Sign out
          </button>
        </header>
        <main style={{ padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
