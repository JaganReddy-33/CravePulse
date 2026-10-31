import React, { useCallback, useEffect, useState } from "react";
import api from "../../services/api";

const EMPTY_FORM = { name: "", imageUrl: "", displayOrder: 0, active: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/admin/categories");
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load cuisine categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        imageUrl: form.imageUrl.trim(),
        displayOrder: Number(form.displayOrder),
      };
      if (
        !payload.name ||
        !/^https:\/\//i.test(payload.imageUrl) ||
        !Number.isInteger(payload.displayOrder) ||
        payload.displayOrder < 0
      ) {
        throw new Error(
          "Enter a category name, an HTTPS photo URL, and a non-negative whole-number display order.",
        );
      }

      if (editingId) {
        await api.post(`/admin/categories/${editingId}/update`, payload);
        setMessage("Category updated.");
      } else {
        await api.post("/admin/categories", payload);
        setMessage("Category created.");
      }
      resetForm();
      await loadCategories();
    } catch (saveError) {
      setError(saveError.message || "Unable to save this category.");
    } finally {
      setSaving(false);
    }
  };

  const editCategory = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      imageUrl: category.imageUrl || "",
      displayOrder: category.displayOrder ?? 0,
      active: Boolean(category.active),
    });
    setMessage("");
  };

  const deactivateCategory = async (category) => {
    if (
      !window.confirm(
        `Hide "${category.name}" from customer cuisine filters? You can restore it by editing the category.`,
      )
    )
      return;
    setError("");
    try {
      await api.post(`/admin/categories/${category.id}/delete`);
      await loadCategories();
    } catch (deleteError) {
      setError(deleteError.message || "Unable to deactivate this category.");
    }
  };

  return (
    <section>
      <div className="mb-4">
        <h1 className="h3 mb-1">Cuisine discovery categories</h1>
        <p className="text-secondary mb-0">
          Manage the photo-based restaurant filters shown on the customer home
          page.
        </p>
      </div>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      {message && (
        <div role="status" className="alert alert-success">
          {message}
        </div>
      )}

      <form
        className="card border-0 shadow-sm rounded-4 p-4 mb-4"
        onSubmit={saveCategory}
      >
        <h2 className="h5 mb-3">
          {editingId ? "Edit category" : "Add cuisine category"}
        </h2>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="category-name">
              Category name
            </label>
            <input
              id="category-name"
              className="form-control"
              maxLength={100}
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="category-image">
              Real photo URL (HTTPS)
            </label>
            <input
              id="category-image"
              className="form-control"
              type="url"
              pattern="https://.*"
              maxLength={500}
              placeholder="https://images.example.com/cuisine.jpg"
              required
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
            />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label" htmlFor="category-order">
              Display order
            </label>
            <input
              id="category-order"
              className="form-control"
              type="number"
              min="0"
              step="1"
              required
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
            />
          </div>
          {editingId && (
            <div className="col-12">
              <label className="form-check-label">
                <input
                  className="form-check-input me-2"
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />
                Visible to customers
              </label>
            </div>
          )}
        </div>
        {form.imageUrl && /^https:\/\//i.test(form.imageUrl) && (
          <div className="d-flex align-items-center gap-3 mt-3">
            <img
              src={form.imageUrl}
              alt="Category photo preview"
              width="72"
              height="72"
              className="rounded-circle object-fit-cover"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
            <span className="small text-secondary">Photo preview</span>
          </div>
        )}
        <div className="d-flex gap-2 mt-3">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add category"}
          </button>
          {editingId && (
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4">
        <h2 className="h5 mb-3">Managed filters</h2>
        {loading ? (
          <p className="text-secondary mb-0">Loading categories…</p>
        ) : categories.length === 0 ? (
          <p className="text-secondary mb-0">
            No categories have been configured.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <img
                        src={category.imageUrl}
                        alt=""
                        width="48"
                        height="48"
                        className="rounded-circle object-fit-cover"
                        loading="lazy"
                      />
                    </td>
                    <td className="fw-semibold">{category.name}</td>
                    <td>{category.displayOrder}</td>
                    <td>
                      <span
                        className={`badge ${category.active ? "bg-success" : "bg-secondary"}`}
                      >
                        {category.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => editCategory(category)}
                      >
                        Edit
                      </button>
                      {category.active && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => deactivateCategory(category)}
                        >
                          Hide
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
