import { useQuery } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "../../auth/apiClient.js";

export function Dashboard() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data;
    },
    staleTime: 60_000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/shop/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      if (
        selectedOrder &&
        (selectedOrder.id === variables.id ||
          selectedOrder._id === variables.id)
      ) {
        setSelectedOrder((o) => (o ? { ...o, status: variables.status } : o));
      }
    },
  });

  const cards = [
    {
      label: "Total Products",
      value: isLoading ? "…" : (data?.totalProducts ?? 0).toLocaleString(),
    },
    {
      label: "Visible Products",
      value: isLoading ? "…" : (data?.visibleProducts ?? 0).toLocaleString(),
    },
    {
      label: "Categories",
      value: isLoading ? "…" : (data?.categoriesCount ?? 0).toLocaleString(),
    },
    {
      label: "Orders",
      value: isLoading ? "…" : (data?.ordersCount ?? 0).toLocaleString(),
    },
  ];

  const recentOrders = Array.isArray(data?.last10Orders)
    ? data.last10Orders
    : [];

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return `$${n.toFixed(2)}`;
  };

  const statusToStyle = useMemo(
    () => ({
      pending: { label: "Pending", color: "#fbbf24" },
      completed: { label: "Completed", color: "#34d399" },
    }),
    []
  );

  const pill = (label, color) => (
    <span
      style={{
        background: `${color}26`,
        color,
        border: `1px solid ${color}40`,
        padding: "4px 8px",
        borderRadius: 999,
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );

  return (
    <div style={{ color: "#cbd5e1" }}>
      <h2
        style={{
          margin: 0,
          marginBottom: 16,
          color: "#e5e7eb",
          fontSize: 22,
          fontWeight: 800,
        }}
      >
        Dashboard
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ color: "#9ca3af", fontSize: 12 }}>{card.label}</div>
            <div
              style={{
                color: "#e5e7eb",
                marginTop: 8,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <h3
        style={{
          margin: 0,
          marginBottom: 12,
          color: "#e5e7eb",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Recent Orders
      </h3>
      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {!isLoading && !isError && recentOrders.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              minHeight: 80,
              textAlign: "center",
            }}
          >
            No orders to show
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
            }}
          >
            <thead>
              <tr style={{ color: "#9ca3af", textAlign: "left", fontSize: 12 }}>
                <th style={{ padding: "12px 16px" }}>ORDER ID</th>
                <th style={{ padding: "12px 16px" }}>CREATED AT</th>
                <th style={{ padding: "12px 16px" }}>TOTAL AMOUNT</th>
                <th style={{ padding: "12px 16px" }}>STATUS</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && recentOrders.length === 0 && (
                <tr>
                  <td
                    style={{ padding: "12px 16px", color: "#9ca3af" }}
                    colSpan={5}
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    style={{ padding: "12px 16px", color: "#f87171" }}
                    colSpan={5}
                  >
                    Failed to load orders
                  </td>
                </tr>
              )}
              {recentOrders.map((order, idx) => {
                const orderId = order?.id ?? order?._id ?? "—";
                const createdAt = order?.createdAt
                  ? new Date(order.createdAt).toISOString().slice(0, 10)
                  : "—";
                const totalAmount =
                  typeof order?.totalAmount === "number"
                    ? `$${order.totalAmount.toFixed(2)}`
                    : order?.totalAmount ?? "—";
                const status = (order?.status || "Pending").toString();
                const isCompleted = /^complete/i.test(status);
                return (
                  <tr
                    key={orderId}
                    style={{
                      borderTop:
                        idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "#e5e7eb" }}>
                      {`#${orderId}`}
                    </td>
                    <td style={{ padding: "12px 16px" }}>{createdAt}</td>
                    <td style={{ padding: "12px 16px" }}>{totalAmount}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {isCompleted ? (
                        <span
                          style={{
                            background: "rgba(34,197,94,0.15)",
                            color: "#34d399",
                            border: "1px solid rgba(34,197,94,0.25)",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                          }}
                        >
                          Completed
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "rgba(245,158,11,0.15)",
                            color: "#fbbf24",
                            border: "1px solid rgba(245,158,11,0.25)",
                            padding: "4px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                          }}
                        >
                          {status}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          background: "transparent",
                          color: "#60a5fa",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,12,0.65)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "stretch",
            zIndex: 50,
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              width: 480,
              maxWidth: "min(100vw, 480px)",
              height: "100%",
              background: "#0e1624",
              borderLeft: "1px solid rgba(255,255,255,0.08)",
              padding: 16,
              overflowY: "auto",
              boxSizing: "border-box",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: "#e5e7eb",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                Order #{selectedOrder?.id || selectedOrder?._id}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: "transparent",
                  color: "#94a3b8",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
              {selectedOrder?.createdAt
                ? new Date(selectedOrder.createdAt).toLocaleString()
                : ""}
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
                Items
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {(selectedOrder?.items || []).map((it) => {
                  const qty = Number(it?.quantity || 0);
                  const unit = Number(it?.unitPrice || 0);
                  const productId =
                    it?.product?.id || it?.productId || it?.product?._id || "";
                  const productName =
                    it?.product?.name ||
                    it?.productName ||
                    (productId ? `Product ${productId}` : "Product");
                  return (
                    <div
                      key={it?.id || it?._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#cbd5e1",
                      }}
                    >
                      <div>
                        {productName} {qty ? `(x${qty})` : ""}
                      </div>
                      <div>{formatMoney(qty * unit || unit)}</div>
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 12,
                  color: "#e5e7eb",
                  fontWeight: 700,
                }}
              >
                <div>Total</div>
                <div>{formatMoney(selectedOrder?.totalAmount)}</div>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
                Customer
              </div>
              <div style={{ color: "#cbd5e1" }}>
                {selectedOrder?.user?.name || "—"}
              </div>
              {selectedOrder?.user?.email && (
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {selectedOrder.user.email}
                </div>
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 12,
                marginTop: 12,
              }}
            >
              <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>
                Status
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={String(selectedOrder?.status || "pending")}
                  onChange={(e) => {
                    const id = selectedOrder?.id || selectedOrder?._id;
                    if (!id) return;
                    statusMutation.mutate({ id, status: e.target.value });
                  }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#cbd5e1",
                    borderRadius: 8,
                    height: 36,
                    padding: "0 12px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
                <button
                  onClick={() => setSelectedOrder(null)}
                  disabled={statusMutation.isLoading}
                  style={{
                    background: "#2563eb",
                    color: "#e5e7eb",
                    border: "1px solid rgba(37,99,235,0.6)",
                    height: 36,
                    borderRadius: 8,
                    padding: "0 12px",
                    cursor: "pointer",
                    opacity: statusMutation.isLoading ? 0.7 : 1,
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
