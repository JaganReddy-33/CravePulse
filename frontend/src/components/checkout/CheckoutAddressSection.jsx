import React, { useState } from "react";
import ModalPortal from "../ModalPortal";
import { sameAddressId } from "../../utils/address";
import {
  isSafeGoogleMapsUrl,
  parseGoogleMapsCoordinates,
} from "../../utils/googleMaps";

const initialAddress = () => ({
  title: "Home",
  addressLine: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  mapsUrl: "",
});

const CheckoutAddressSection = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState(initialAddress);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    if (!isSafeGoogleMapsUrl(newAddress.mapsUrl)) {
      setSaveError("Enter a valid HTTPS Google Maps link.");
      return;
    }
    if (!parseGoogleMapsCoordinates(newAddress.mapsUrl)) {
      setSaveError(
        "Could not read coordinates from that link. Use a Maps URL with /@latitude,longitude, !3dlatitude!4dlongitude, or ?q=latitude,longitude.",
      );
      return;
    }

    setSaveError("");
    setSaving(true);
    try {
      await onSaveAddress({
        ...newAddress,
        title: newAddress.title.trim(),
        addressLine: newAddress.addressLine.trim(),
        landmark: newAddress.landmark.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        postalCode: newAddress.postalCode.trim(),
        mapsUrl: newAddress.mapsUrl.trim(),
      });
      setShowAddModal(false);
      setNewAddress(initialAddress());
    } catch (error) {
      setSaveError(error.message || "The address could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (key, value) =>
    setNewAddress((previous) => ({ ...previous, [key]: value }));

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-extrabold text-dark mb-0">
          <i className="bi bi-geo-alt-fill text-danger me-2"></i>
          Delivery Address
        </h5>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold touch-target"
          onClick={() => {
            setSaveError("");
            setShowAddModal(true);
          }}
        >
          + Add New Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-muted small mb-0">
          Add a delivery address to calculate the delivery fee and continue.
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {addresses.map((address) => {
            const selected = sameAddressId(selectedAddressId, address.id);
            const fallbackMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${address.addressLine}, ${address.city || ""} ${address.postalCode || ""}`,
            )}`;
            return (
              <label
                key={address.id}
                className={`d-flex align-items-start gap-3 p-3 rounded-4 border cursor-pointer transition ${
                  selected
                    ? "border-danger bg-danger-subtle"
                    : "border-light bg-light"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryAddress"
                  checked={selected}
                  onChange={() => onSelectAddress(address.id)}
                  className="form-check-input mt-1"
                />
                <div className="flex-grow-1 text-truncate">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <strong className="text-dark small text-uppercase">
                      {address.title || "Address"}
                    </strong>
                    {(address.default ?? address.isDefault) && (
                      <span className="badge bg-secondary-subtle text-secondary small">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-muted small mb-1">{address.addressLine}</p>
                  {address.landmark && (
                    <small
                      className="text-secondary d-block"
                      style={{ fontSize: 11 }}
                    >
                      Landmark: {address.landmark}
                    </small>
                  )}
                  <a
                    href={
                      isSafeGoogleMapsUrl(address.mapsUrl)
                        ? address.mapsUrl
                        : fallbackMapsUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="small text-primary text-decoration-none d-inline-flex align-items-center gap-1 mt-1"
                    style={{ fontSize: 11 }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <i className="bi bi-map"></i> View on Google Maps ↗
                  </a>
                </div>
                {selected && (
                  <i className="bi bi-check-circle-fill text-danger fs-5"></i>
                )}
              </label>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <ModalPortal isOpen={showAddModal}>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 10050, backdropFilter: "blur(4px)" }}
            onClick={() => setShowAddModal(false)}
          >
            <div
              className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
              style={{ maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-address-title"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5
                  className="fw-extrabold text-dark mb-0"
                  id="add-address-title"
                >
                  Add Delivery Address
                </h5>
                <button
                  type="button"
                  className="btn-close touch-target"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <fieldset className="mb-3">
                  <legend className="form-label small fw-bold">
                    Address Tag
                  </legend>
                  <div className="d-flex gap-2">
                    {["Home", "Work", "Other"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 touch-target ${
                          newAddress.title === tag
                            ? "btn-danger text-white fw-bold"
                            : "btn-light border"
                        }`}
                        aria-pressed={newAddress.title === tag}
                        onClick={() => updateAddress("title", tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mb-3">
                  <label
                    className="form-label small fw-bold"
                    htmlFor="address-line"
                  >
                    Street Address / House No.
                  </label>
                  <textarea
                    id="address-line"
                    className="form-control rounded-3"
                    rows={2}
                    required
                    maxLength={255}
                    placeholder="e.g. Flat 304, Palm Grove Apartments, 5th Cross Road"
                    value={newAddress.addressLine}
                    onChange={(event) =>
                      updateAddress("addressLine", event.target.value)
                    }
                  />
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label
                      className="form-label small fw-bold"
                      htmlFor="address-landmark"
                    >
                      Landmark
                    </label>
                    <input
                      id="address-landmark"
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      maxLength={120}
                      placeholder="e.g. Near Indiranagar Club"
                      value={newAddress.landmark}
                      onChange={(event) =>
                        updateAddress("landmark", event.target.value)
                      }
                    />
                  </div>
                  <div className="col-6">
                    <label
                      className="form-label small fw-bold"
                      htmlFor="address-postal-code"
                    >
                      Postal PIN Code
                    </label>
                    <input
                      id="address-postal-code"
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      required
                      maxLength={20}
                      placeholder="560038"
                      value={newAddress.postalCode}
                      onChange={(event) =>
                        updateAddress("postalCode", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  {[
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                  ].map(({ key, label }) => (
                    <div className="col-12 col-sm-6" key={key}>
                      <label className="form-label" htmlFor={`address-${key}`}>
                        {label}
                      </label>
                      <input
                        id={`address-${key}`}
                        className="form-control"
                        required
                        maxLength={100}
                        value={newAddress[key]}
                        onChange={(event) =>
                          updateAddress(key, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="mb-3">
                  <label
                    className="form-label small fw-bold"
                    htmlFor="address-maps-url"
                  >
                    Google Maps link
                  </label>
                  <input
                    id="address-maps-url"
                    className="form-control"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    required
                    maxLength={500}
                    placeholder="https://www.google.com/maps/@12.9716,77.5946,17z"
                    value={newAddress.mapsUrl}
                    onChange={(event) =>
                      updateAddress("mapsUrl", event.target.value)
                    }
                    aria-describedby="address-maps-help"
                  />
                  <p
                    id="address-maps-help"
                    className="small text-muted mt-1 mb-0"
                  >
                    Paste an HTTPS Google Maps pin link. Coordinates are read
                    from the link; shortened links without coordinates are not
                    supported.
                  </p>
                </div>

                {saveError && (
                  <div className="alert alert-danger" role="alert">
                    {saveError}
                  </div>
                )}
                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border rounded-pill px-3 touch-target"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-bold touch-target text-white"
                    style={{
                      background: "var(--c-primary)",
                      borderColor: "var(--c-primary)",
                    }}
                  >
                    {saving ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default CheckoutAddressSection;
