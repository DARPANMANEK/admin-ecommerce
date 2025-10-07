import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../auth/apiClient.js";

export function Orders() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", page, limit],
    queryFn: async () => {
      const res = await api.get("/shop/orders", {
        params: {
          page,
          limit,
        },
      });
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const total = Number(res.data?.total || 0);
      const pages = Number(res.data?.pages || 1);
      return { items, total, pages };
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const orders = Array.isArray(data?.items) ? data.items : [];
  const total = Number(data?.total || 0);
  const pages = Number(data?.pages || 1);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/shop/orders/${id}/status`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (
        selectedOrder &&
        (selectedOrder.id === variables.id ||
          selectedOrder._id === variables.id)
      ) {
        setSelectedOrder((o) => (o ? { ...o, status: variables.status } : o));
      }
    },
  });

  const formatMoney = (value) => {
    const n = Number(value || 0);
    return `$${n.toFixed(2)}`;
  };

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

  const statusToStyle = useMemo(
    () => ({
      pending: { label: "Pending", color: "#fbbf24" },
      completed: { label: "Completed", color: "#34d399" },
    }),
    []
  );

  return (
    <div style={{ color: "#cbd5e1" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h2
          style={{ margin: 0, color: "#e5e7eb", fontSize: 22, fontWeight: 800 }}
        >
          Orders
        </h2>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
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
              <th style={{ padding: "12px 16px" }}>CUSTOMER</th>
              <th style={{ padding: "12px 16px" }}>TOTAL</th>
              <th style={{ padding: "12px 16px" }}>STATUS</th>
              <th style={{ padding: "12px 16px" }}>ITEMS</th>
              <th style={{ padding: "12px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td
                  style={{ padding: "12px 16px", color: "#9ca3af" }}
                  colSpan={7}
                >
                  Loading…
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td
                  style={{ padding: "12px 16px", color: "#f87171" }}
                  colSpan={7}
                >
                  Failed to load orders
                </td>
              </tr>
            )}
            {!isLoading && !isError && orders.length === 0 && (
              <tr>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                  colSpan={7}
                >
                  No orders
                </td>
              </tr>
            )}
            {orders.map((o, idx) => {
              const id = o?.id || o?._id || `order-${idx}`;
              const createdAt = o?.createdAt || o?.created_at || o?.created_on;
              const customerName = o?.user?.name || null;
              const customerEmail =
                o?.user?.email || o?.customer?.email || null;
              const customerId =
                o?.userId ||
                o?.user_id ||
                o?.user?.id ||
                o?.customer?.id ||
                "—";
              const customer =
                customerName || customerEmail || `#${customerId}`;
              const totalAmount = o?.totalAmount ?? o?.total ?? 0;
              const statusKey = String(o?.status || "pending").toLowerCase();
              const itemsCount = Array.isArray(o?.items)
                ? o.items.length
                : o?.itemsCount ?? 0;
              const style = statusToStyle[statusKey] || statusToStyle.pending;
              return (
                <tr
                  key={id}
                  style={{
                    borderTop:
                      idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <td style={{ padding: "12px 16px", color: "#e5e7eb" }}>
                    #{id}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {createdAt ? new Date(createdAt).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{String(customer)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {formatMoney(totalAmount)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {pill(style.label, style.color)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{itemsCount}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      title="View"
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        background: "transparent",
                        color: "#60a5fa",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 8,
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
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={{ color: "#94a3b8", fontSize: 12 }}>
          {total > 0
            ? `Showing ${(page - 1) * limit + 1} to ${Math.min(
                page * limit,
                total
              )} of ${total} results`
            : ""}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={isLoading || page <= 1}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              height: 36,
              borderRadius: 8,
              padding: "0 12px",
              cursor: "pointer",
            }}
          >
            Previous
          </button>
          <button
            onClick={() =>
              setPage((p) => (pages ? Math.min(pages, p + 1) : p + 1))
            }
            disabled={isLoading || (pages ? page >= pages : false)}
            style={{
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              height: 36,
              borderRadius: 8,
              padding: "0 12px",
              cursor: "pointer",
            }}
          >
            Next
          </button>
          <select
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
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
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
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
              {statusMutation.isError && (
                <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>
                  Failed to update status
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
