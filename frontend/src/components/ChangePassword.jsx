import React, { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
export default function ChangePassword() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/auth/password", { currentPassword, newPassword });
      await logout();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="card p-4 mt-4 shadow-sm text-light"
      style={{
        background: "rgba(15, 23, 42, 0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h2 className="h5">Change password</h2>
      <p className="small text-secondary">
        You will need to sign in again after changing your password.
      </p>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      <label className="form-label" htmlFor="current-password">
        Current password
      </label>
      <input
        id="current-password"
        className="form-control mb-3"
        type="password"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <label className="form-label" htmlFor="new-password">
        New password (at least 12 characters)
      </label>
      <input
        id="new-password"
        className="form-control mb-3"
        type="password"
        autoComplete="new-password"
        required
        minLength={12}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <button className="btn btn-primary align-self-start" disabled={saving}>
        {saving ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
