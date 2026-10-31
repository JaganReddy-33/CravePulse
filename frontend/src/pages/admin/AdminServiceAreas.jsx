import React, { useEffect, useState } from "react";
import api from "../../services/api";
export default function AdminServiceAreas() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    city: "",
    name: "",
    latitude: "",
    longitude: "",
    radiusKm: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = () =>
    api
      .get("/catalog/locations")
      .then((res) => setCities(res.data || []))
      .catch((err) => setError(err.message));
  useEffect(() => {
    load();
  }, []);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/catalog/locations", form);
      await load();
      setForm({
        city: "",
        name: "",
        latitude: "",
        longitude: "",
        radiusKm: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <section>
      <h1 className="h3 mb-3">Service areas</h1>
      <p className="text-secondary">
        Configure the actual cities and localities shown to customers.
      </p>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      <form className="card p-4 mb-4" onSubmit={submit}>
        <div className="row g-3">
          {Object.keys(form).map((key) => (
            <div className="col-12 col-md-6" key={key}>
              <label className="form-label" htmlFor={`zone-${key}`}>
                {
                  {
                    city: "City",
                    name: "Locality / zone name",
                    latitude: "Latitude",
                    longitude: "Longitude",
                    radiusKm: "Service radius (km)",
                  }[key]
                }
              </label>
              <input
                className="form-control"
                id={`zone-${key}`}
                required
                type={
                  ["latitude", "longitude", "radiusKm"].includes(key)
                    ? "number"
                    : "text"
                }
                step="any"
                maxLength={100}
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <button
          className="btn btn-primary align-self-start mt-3"
          disabled={saving}
        >
          {saving ? "Saving..." : "Add service area"}
        </button>
      </form>
      {!cities.length && <p>No service areas configured yet.</p>}
      {cities.map((city) => (
        <article className="card p-3 mb-3" key={city.id}>
          <h2 className="h5">{city.name}</h2>
          <ul className="mb-0">
            {city.hubs.map((hub) => (
              <li key={hub.id}>{hub.name}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
