import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadImageViaSignedUrl } from "../../auth/apiClient.js";

export function Categories() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    visible: true,
    imageFile: null,
    existingImageUrl: "",
  });
  const [uploadError, setUploadError] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["categories", page, limit],
    queryFn: async () => {
      const res = await api.get("/shop/categories", {
        params: { page, limit },
      });
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.items || res.data?.data || [];
      const totalFromHeaders = Number(res.headers?.["x-total-count"]) || 0;
      const totalFromBody =
        Number(res.data?.total) || Number(res.data?.pagination?.total) || 0;
      const total = totalFromBody || totalFromHeaders || items.length;
      return { items, total };
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const categories = Array.isArray(data?.items) ? data.items : [];
  const totalCount = Number(data?.total || 0);
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / (limit || 1)));

  const filtered = useMemo(() => {
    return categories.sort((a, b) => {
      const sa = Number(a?.sortId ?? a?.sort ?? 0);
      const sb = Number(b?.sortId ?? b?.sort ?? 0);
      return sa - sb;
    });
  }, [categories]);

  const renderPill = (label, color) => (
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

  const addCategoryMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/shop/categories", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
      setEditingCategoryId(null);
      setFormValues({
        name: "",
        visible: true,
        imageFile: null,
        existingImageUrl: "",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/shop/categories/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsModalOpen(false);
      setEditingCategoryId(null);
      setFormValues({
        name: "",
        visible: true,
        imageFile: null,
        existingImageUrl: "",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/shop/categories/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const commaIdx = result.indexOf(",");
        const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
        resolve({ base64, mime: file.type || "application/octet-stream" });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const submitNewCategory = async (e) => {
    e.preventDefault();
    const payload = {
      name: formValues.name?.trim(),
      visible: Boolean(formValues.visible),
    };
    setUploadError("");
    if (formValues.imageFile) {
      try {
        const imageUrl = await uploadImageViaSignedUrl(formValues.imageFile);
        if (imageUrl) payload.imageUrl = imageUrl;
      } catch (err) {
        console.log(err, "err");
        setUploadError("Failed to upload image. Please try a smaller file.");
        return;
      }
    }
    if (editingCategoryId) {
      updateCategoryMutation.mutate({ id: editingCategoryId, payload });
    } else {
      addCategoryMutation.mutate(payload);
    }
  };

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
          Product Categories
        </h2>
        <button
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
          onClick={() => {
            setEditingCategoryId(null);
            setFormValues({ name: "", visible: true });
            setIsModalOpen(true);
          }}
        >
          + Add Category
        </button>
      </div>

      <div style={{ height: 12 }} />

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
              <th style={{ padding: "12px 16px" }}>CATEGORY NAME</th>
              <th style={{ padding: "12px 16px" }}>TYPE</th>
              <th style={{ padding: "12px 16px" }}>VISIBILITY</th>
              <th style={{ padding: "12px 16px" }}>SORT ID</th>
              <th style={{ padding: "12px 16px" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
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
                  Failed to load categories
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td
                  style={{
                    padding: "12px 16px",
                    color: "#9ca3af",
                    textAlign: "center",
                  }}
                  colSpan={5}
                >
                  No categories
                </td>
              </tr>
            )}
            {filtered.map((cat, idx) => {
              const name = cat?.name || cat?.title || "—";
              const isSub = /^sub$/i.test((cat?.type || "").toString());
              const isVisible = Boolean(
                cat?.visible ?? cat?.isVisible ?? cat?.status === "Visible"
              );
              const sortId = cat?.sortId ?? cat?.sort ?? idx + 1;
              return (
                <tr
                  key={cat?.id || cat?._id || `${name}-${idx}`}
                  style={{
                    borderTop:
                      idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <td style={{ padding: "12px 16px" }}>
                    {cat?.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={name}
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
                    {name}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isSub ? "Sub" : "Main"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {isVisible
                      ? renderPill("Visible", "#34d399")
                      : renderPill("Hidden", "#94a3b8")}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{sortId}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      title="Edit"
                      style={{
                        background: "transparent",
                        color: "#60a5fa",
                        border: "none",
                        cursor: "pointer",
                        marginRight: 8,
                      }}
                      onClick={() => {
                        setEditingCategoryId(cat?.id || cat?._id || null);
                        setFormValues({
                          name: cat?.name || "",
                          visible: Boolean(
                            cat?.visible ??
                              cat?.isVisible ??
                              cat?.status === "Visible"
                          ),
                          imageFile: null,
                          existingImageUrl: cat?.imageUrl || "",
                        });
                        setIsModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete"
                      style={{
                        background: "transparent",
                        color: "#f87171",
                        border: "none",
                        cursor: "pointer",
                      }}
                      disabled={deleteCategoryMutation.isLoading}
                      onClick={() => {
                        const id = cat?.id || cat?._id;
                        if (!id) return;
                        const confirmed = window.confirm(
                          `Delete category "${name}"? This cannot be undone.`
                        );
                        if (confirmed) {
                          deleteCategoryMutation.mutate(id);
                        }
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
          Page {totalPages ? Math.min(page, totalPages) : page} of {totalPages}
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
              setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1))
            }
            disabled={isLoading || (totalPages ? page >= totalPages : false)}
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
            !addCategoryMutation.isLoading && setIsModalOpen(false)
          }
        >
          <div
            style={{
              width: 520,
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
                {editingCategoryId ? "Edit Category" : "Add Category"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={
                  addCategoryMutation.isLoading ||
                  updateCategoryMutation.isLoading
                }
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

            <form
              onSubmit={submitNewCategory}
              style={{ display: "grid", gap: 12 }}
            >
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ color: "#9ca3af", fontSize: 12 }}>Name</span>
                <input
                  required
                  value={formValues.name}
                  onChange={(e) =>
                    setFormValues((v) => ({ ...v, name: e.target.value }))
                  }
                  placeholder="e.g., Electronics"
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

              <div
                style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}
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
              </div>

              {(addCategoryMutation.isError ||
                updateCategoryMutation.isError) && (
                <div style={{ color: "#f87171", fontSize: 12 }}>
                  Failed to add category
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
                  disabled={
                    addCategoryMutation.isLoading ||
                    updateCategoryMutation.isLoading
                  }
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
                  disabled={
                    addCategoryMutation.isLoading ||
                    updateCategoryMutation.isLoading
                  }
                  style={{
                    background: "#2563eb",
                    color: "#e5e7eb",
                    border: "1px solid rgba(37,99,235,0.6)",
                    height: 36,
                    borderRadius: 8,
                    padding: "0 12px",
                    cursor: "pointer",
                    opacity:
                      addCategoryMutation.isLoading ||
                      updateCategoryMutation.isLoading
                        ? 0.7
                        : 1,
                  }}
                >
                  {addCategoryMutation.isLoading ||
                  updateCategoryMutation.isLoading
                    ? "Saving…"
                    : editingCategoryId
                    ? "Update Category"
                    : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categories;
