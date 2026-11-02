import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { isSafeGoogleMapsUrl } from "../../utils/googleMaps";

const EMPTY_FORM = {
  city: "",
  name: "",
  mapsUrl: "",
  radiusKm: "",
};

const FIELD_LABELS = {
  city: "City",
  name: "Locality / zone name",
  mapsUrl: "Google Maps location link",
  radiusKm: "Service radius (km)",
};

export default function AdminServiceAreas() {
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const response = await api.get("/catalog/locations");
      setCities(response.data || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!isSafeGoogleMapsUrl(form.mapsUrl)) {
        throw new Error("Enter a valid HTTPS Google Maps location link.");
      }
      await api.post("/catalog/locations", {
        ...form,
        city: form.city.trim(),
        name: form.name.trim(),
        mapsUrl: form.mapsUrl.trim(),
        radiusKm: Number(form.radiusKm),
      });
      await load();
      setForm({ ...EMPTY_FORM });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1 className="h3 mb-3">Service areas</h1>
      <p className="text-secondary">
        Configure the cities and localities shown to customers. Coordinates are read from each
        Google Maps link and saved with the service area.
      </p>
      {error && (
        <div role="alert" className="alert alert-danger">
          {error}
        </div>
      )}
      <form className="card p-4 mb-4" onSubmit={submit}>
        <div className="row g-3">
          {Object.keys(EMPTY_FORM).map((key) => (
            <div className="col-12 col-md-6" key={key}>
              <label className="form-label" htmlFor={`zone-${key}`}>
                {FIELD_LABELS[key]}
              </label>
              <input
                className="form-control"
                id={`zone-${key}`}
                required
                type={key === "radiusKm" ? "number" : key === "mapsUrl" ? "url" : "text"}
                step={key === "radiusKm" ? "any" : undefined}
                min={key === "radiusKm" ? "0.1" : undefined}
                max={key === "radiusKm" ? "100" : undefined}
                maxLength={key === "mapsUrl" ? 500 : 100}
                inputMode={key === "mapsUrl" ? "url" : undefined}
                placeholder={key === "mapsUrl" ? "Paste a Google Maps pin or place link" : ""}
                value={form[key]}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    [key]: event.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
        <button className="btn btn-primary align-self-start mt-3" disabled={saving}>
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
