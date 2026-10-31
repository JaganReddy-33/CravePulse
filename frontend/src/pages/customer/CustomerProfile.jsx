import ChangePassword from "../../components/ChangePassword";
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import CheckoutAddressSection from "../../components/checkout/CheckoutAddressSection";
import { getDefaultAddress } from "../../utils/address";
export default function CustomerProfile() {
  const { user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([api.get("/auth/addresses"), api.get("/auth/wallet")])
      .then(([a, w]) => {
        if (!active) return;
        if (!a.success || !w.success) throw new Error("Unable to load account");
        setAddresses(a.data || []);
        setBalance(w.data.balance);
        setSelected(getDefaultAddress(a.data || [])?.id ?? null);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await api.post("/auth/profile", form);
      if (!res.success) throw new Error("Profile was not saved");
      await refreshProfile();
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const addAddress = async (payload) => {
    const res = await api.post("/auth/addresses", payload);
    if (!res.success || !res.data?.id) throw new Error("Address was not saved");
    setAddresses((prev) => [...prev, res.data]);
    setSelected(res.data.id);
  };
  const selectAddress = async (id) => {
    try {
      const res = await api.post(`/auth/addresses/${id}/default`);
      if (!res.success)
        throw new Error(res.message || "The default address was not updated.");
      setSelected(id);
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          default: String(a.id) === String(id),
          isDefault: String(a.id) === String(id),
        })),
      );
    } catch (err) {
      setError(err.message);
    }
  };
  const deleteAddress = async (id) => {
    try {
      const res = await api.delete(`/auth/addresses/${id}`);
      if (!res.success)
        throw new Error(res.message || "Address was not deleted.");
      const deleted = addresses.find(
        (address) => String(address.id) === String(id),
      );
      const remaining = addresses.filter(
        (address) => String(address.id) !== String(id),
      );
      setAddresses(remaining);
      if (
        String(selected) === String(id) ||
        (deleted?.default ?? deleted?.isDefault)
      ) {
        const fallback = getDefaultAddress(remaining);
        setSelected(fallback?.id ?? null);
        if (fallback) await selectAddress(fallback.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <section className="container py-4" style={{ maxWidth: 1000 }}>
      <h1 className="h3 fw-bold">Your account</h1>
      <p className="text-muted">
        Manage your details and saved delivery addresses.
      </p>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}
      <form className="card p-4 mb-4" onSubmit={save}>
        <h2 className="h5">Personal details</h2>
        <div className="row g-3">
          {["fullName", "phone", "avatarUrl"].map((key) => (
            <div className="col-12 col-md-6" key={key}>
              <label htmlFor={`profile-${key}`} className="form-label">
                {
                  {
                    fullName: "Full name",
                    phone: "Phone number",
                    avatarUrl: "Profile image URL (optional)",
                  }[key]
                }
              </label>
              <input
                id={`profile-${key}`}
                className="form-control"
                type={
                  key === "avatarUrl" ? "url" : key === "phone" ? "tel" : "text"
                }
                required={key === "fullName"}
                maxLength={key === "avatarUrl" ? 500 : 100}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="profile-email">
              Email
            </label>
            <input
              id="profile-email"
              className="form-control"
              readOnly
              value={user?.email || ""}
            />
          </div>
        </div>
        <button
          className="btn btn-primary align-self-start mt-4"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save details"}
        </button>
      </form>
      <CheckoutAddressSection
        addresses={addresses}
        selectedAddressId={selected}
        onSelectAddress={selectAddress}
        onSaveAddress={addAddress}
        onDeleteAddress={deleteAddress}
      />
      <div className="card p-4">
        <h2 className="h5">Wallet balance</h2>
        <p className="fs-3 mb-0">
          {balance === null
            ? "Loading..."
            : new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
              }).format(Number(balance))}
        </p>
      </div>
      <ChangePassword />
    </section>
  );
}
