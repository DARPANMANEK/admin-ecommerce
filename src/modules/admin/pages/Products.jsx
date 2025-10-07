import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadImageViaSignedUrl } from "../../auth/apiClient.js";

export function Products() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

  const [formValues, setFormValues] = useState({
    name: "",
    price: "",
    discountedPrice: "",
    description: "",
    categoryid: "",
    visible: true,
    isInStock: true,
    imageFile: null,
    existingImageUrl: "",
  });
  const [uploadError, setUploadError] = useState("");

  const queryClient = useQueryClient();

  const {
    data: listData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products", page, limit],
    queryFn: async () => {
      const res = await api.get("/shop/products", { params: { page, limit } });
      const items = Array.isArray(res.data) ? res.data : res.data?.data || [];
      const total = Number(res.data?.total || 0);
      const pages = Number(res.data?.pages || 1);
      return { items, total, pages };
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories-for-products"],
    queryFn: async () => {
      const res = await api.get("/shop/categories", {
        params: { all: true },
      });
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.items || res.data?.data || [];
      return items;
    },
    staleTime: 5 * 60_000,
  });

  const products = Array.isArray(listData?.items) ? listData.items : [];
  const total = Number(listData?.total || 0);
  const pages = Number(listData?.pages || 1);

  const categoryIdToName = useMemo(() => {
    const map = new Map();
    (categoriesData || []).forEach((c) => {
      map.set(String(c?.id ?? c?._id), c?.name || c?.title || "");
    });
    return map;
  }, [categoriesData]);

  const addMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/shop/products", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      setEditingProductId(null);
      setFormValues({
        name: "",
        price: "",
        discountedPrice: "",
        description: "",
        categoryid: "",
        visible: true,
        isInStock: true,
        imageFile: null,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/shop/products/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsModalOpen(false);
      setEditingProductId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/shop/products/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const openAddModal = () => {
    setEditingProductId(null);
    setFormValues({
      name: "",
      price: "",
      discountedPrice: "",
      description: "",
      categoryid: "",
      visible: true,
      isInStock: true,
      imageFile: null,
      existingImageUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProductId(p?.id || p?._id || null);
    setFormValues({
      name: p?.name || "",
      price: String(p?.price ?? ""),
      discountedPrice: String(p?.discountedPrice ?? ""),
      description: p?.description || "",
      categoryid: String(
        p?.categoryid ||
          p?.categoryId ||
          p?.category?.id ||
          p?.category?._id ||
          ""
      ),
      visible: Boolean(p?.visible ?? p?.isVisible ?? true),
      isInStock: Boolean(p?.isInStock ?? p?.inStock ?? true),
      imageFile: null,
      existingImageUrl: p?.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formValues.name?.trim(),
      price: Number(formValues.price || 0),
      discountedPrice:
        formValues.discountedPrice === ""
          ? undefined
          : Number(formValues.discountedPrice),
      description: formValues.description?.trim() || undefined,
      categoryid: formValues.categoryid || undefined,
      visible: Boolean(formValues.visible),
      isInStock: Boolean(formValues.isInStock),
    };
    setUploadError("");
    if (formValues.imageFile) {
      try {
        const imageUrl = await uploadImageViaSignedUrl(formValues.imageFile);
        if (imageUrl) payload.imageUrl = imageUrl;
      } catch (err) {
        setUploadError("Failed to upload image. Please try a smaller file.");
        return;
      }
    }
    if (editingProductId) {
      updateMutation.mutate({ id: editingProductId, payload });
    } else {
      addMutation.mutate(payload);
    }
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
          Products
        </h2>
        <button
          onClick={openAddModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#2563eb",
            color: "#e5e7eb",
            border: "1px solid rgba(37,99,235,0.6)",
            height: 36,
            borderRadius: 8,
            padding: "0 12px",
            cursor: "pointer",
          }}
        >
          + Add Product
        </button>
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
              <th style={{ padding: "12px 16px" }}>IMAGE</th>
              <th style={{ padding: "12px 16px" }}>PRODUCT NAME</th>
              <th style={{ padding: "12px 16px" }}>PRICE</th>
              <th style={{ padding: "12px 16px" }}>DISCOUNTED PRICE</th>
              <th style={{ padding: "12px 16px" }}>IN STOCK</th>
              <th style={{ padding: "12px 16px" }}>VISIBILITY</th>
              <th style={{ padding: "12px 16px" }}>CATEGORY</th>
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
                  Failed to load products
                </td>
              </tr>
            )}
            {!isLoading && !isError && products.length === 0 && (
              <tr>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                  colSpan={7}
                >
                  No products
                </td>
              </tr>
            )}
            {products.map((p, idx) => {
              const id = p?.id || p?._id || `${p?.name || ""}-${idx}`;
              const price = Number(p?.price ?? 0);
              const discounted =
                p?.discountedPrice != null ? Number(p.discountedPrice) : null;
              const visible = Boolean(p?.visible);
              const inStock = Boolean(p?.isInStock);
              const categoryName =
                p?.category?.name ||
                categoryIdToName.get(String(p?.categoryid || p?.categoryId)) ||
                "—";
              return (
                <tr
                  key={id}
                  style={{
                    borderTop:
                      idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    {p?.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p?.name || ""}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: 6,
                          background: "#0f172a",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 6,
                          background: "#0b1220",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      />
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#e5e7eb" }}>
                    {p?.name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {price ? `$${price.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {discounted != null ? `$${discounted.toFixed(2)}` : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {inStock
                      ? pill("In Stock", "#34d399")
                      : pill("Out of Stock", "#f87171")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {visible
                      ? pill("Visible", "#60a5fa")
                      : pill("Hidden", "#94a3b8")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{categoryName}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      title="Edit"
                      onClick={() => openEditModal(p)}
                      style={{
                        background: "transparent",
                        color: "#60a5fa",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 8,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete"
                      disabled={deleteMutation.isLoading}
                      onClick={() => {
                        const pid = p?.id || p?._id;
                        if (!pid) return;
                        const confirmed = window.confirm(
                          `Delete product "${p?.name}"? This cannot be undone.`
                        );
                        if (confirmed) deleteMutation.mutate(pid);
                      }}
                      style={{
                        background: "transparent",
                        color: "#f87171",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Delete
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

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2,6,12,0.65)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
          }}
          onClick={() =>
            !(addMutation.isLoading || updateMutation.isLoading) &&
            setIsModalOpen(false)
          }
        >
          <div
            style={{
              width: 620,
              maxWidth: "calc(100vw - 32px)",
              background: "#0e1624",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
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
                {editingProductId ? "Edit Product" : "Add Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={addMutation.isLoading || updateMutation.isLoading}
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

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Name</span>
                  <input
                    required
                    value={formValues.name}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, name: e.target.value }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      setFormValues((v) => ({ ...v, imageFile: f || null }));
                    }}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      borderRadius: 8,
                      height: 38,
                      padding: "6px 12px",
                    }}
                  />
                  {!formValues.imageFile && formValues.existingImageUrl && (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <img
                        src={formValues.existingImageUrl}
                        alt="Current"
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 8,
                          background: "#0f172a",
                        }}
                      />
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>
                        Current image
                      </span>
                    </div>
                  )}
                  {formValues.imageFile && (
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>
                      {formValues.imageFile.name}
                    </span>
                  )}
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Price</span>
                  <input
                    required
                    inputMode="decimal"
                    value={formValues.price}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        price: e.target.value.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    Discounted Price
                  </span>
                  <input
                    inputMode="decimal"
                    value={formValues.discountedPrice}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        discountedPrice: e.target.value.replace(/[^0-9.]/g, ""),
                      }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#e5e7eb",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    Category
                  </span>
                  <select
                    value={formValues.categoryid}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        categoryid: e.target.value,
                      }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  >
                    <option value="">None</option>
                    {(categoriesData || []).map((c) => (
                      <option key={c?.id || c?._id} value={c?.id || c?._id}>
                        {c?.name || c?.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>
                  Description
                </span>
                <textarea
                  rows={3}
                  value={formValues.description}
                  onChange={(e) =>
                    setFormValues((v) => ({
                      ...v,
                      description: e.target.value,
                    }))
                  }
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                    resize: "vertical",
                  }}
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>
                    Visibility
                  </span>
                  <select
                    value={formValues.visible ? "Visible" : "Hidden"}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        visible: e.target.value === "Visible",
                      }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  >
                    <option>Visible</option>
                    <option>Hidden</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#9ca3af", fontSize: 12 }}>Stock</span>
                  <select
                    value={formValues.isInStock ? "In Stock" : "Out of Stock"}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        isInStock: e.target.value === "In Stock",
                      }))
                    }
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#cbd5e1",
                      borderRadius: 8,
                      height: 38,
                      padding: "0 12px",
                    }}
                  >
                    <option>In Stock</option>
                    <option>Out of Stock</option>
                  </select>
                </label>
              </div>

              {(addMutation.isError || updateMutation.isError) && (
                <div style={{ color: "#f87171", fontSize: 12 }}>
                  Failed to save product
                </div>
              )}

              {uploadError && (
                <div style={{ color: "#f87171", fontSize: 12 }}>
                  {uploadError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={addMutation.isLoading || updateMutation.isLoading}
                  style={{
                    background: "transparent",
                    color: "#94a3b8",
                    border: "1px solid rgba(148,163,184,0.35)",
                    height: 36,
                    borderRadius: 8,
                    padding: "0 12px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isLoading || updateMutation.isLoading}
                  style={{
                    background: "#2563eb",
                    color: "#e5e7eb",
                    border: "1px solid rgba(37,99,235,0.6)",
                    height: 36,
                    borderRadius: 8,
                    padding: "0 12px",
                    cursor: "pointer",
                    opacity:
                      addMutation.isLoading || updateMutation.isLoading
                        ? 0.7
                        : 1,
                  }}
                >
                  {addMutation.isLoading || updateMutation.isLoading
                    ? "Saving…"
                    : editingProductId
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
