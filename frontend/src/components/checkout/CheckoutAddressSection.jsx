import React, { useState } from 'react';
import ModalPortal from '../ModalPortal';

/**
 * CheckoutAddressSection: Saved addresses picker with add/edit address modal and Google Maps link.
 */
const CheckoutAddressSection = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: 'Home',
    addressLine: '',
    landmark: '',
    city: 'Bangalore',
    postalCode: '560038',
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newAddress.addressLine.trim()) return;
    onSaveAddress(newAddress);
    setShowAddModal(false);
    setNewAddress({
      title: 'Home',
      addressLine: '',
      landmark: '',
      city: 'Bangalore',
      postalCode: '560038',
    });
  };

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
          onClick={() => setShowAddModal(true)}
        >
          + Add New Address
        </button>
      </div>

      {/* Address cards list */}
      <div className="d-flex flex-column gap-3">
        {addresses.map((addr) => (
          <label
            key={addr.id}
            className={`d-flex align-items-start gap-3 p-3 rounded-4 border cursor-pointer transition ${
              selectedAddressId === addr.id ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
            }`}
          >
            <input
              type="radio"
              name="deliveryAddress"
              checked={selectedAddressId === addr.id}
              onChange={() => onSelectAddress(addr.id)}
              className="form-check-input mt-1"
            />
            <div className="flex-grow-1 text-truncate">
              <div className="d-flex align-items-center gap-2 mb-1">
                <strong className="text-dark small text-uppercase">{addr.title || 'Address'}</strong>
                {addr.default && <span className="badge bg-secondary-subtle text-secondary small">Default</span>}
              </div>
              <p className="text-muted small mb-1">{addr.addressLine}</p>
              {addr.landmark && (
                <small className="text-secondary d-block" style={{ fontSize: 11 }}>
                  Landmark: {addr.landmark}
                </small>
              )}
              {/* Google Maps External Navigation Link */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${addr.addressLine}, ${addr.city || 'Bangalore'} ${addr.postalCode || ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="small text-primary text-decoration-none d-inline-flex align-items-center gap-1 mt-1"
                style={{ fontSize: 11 }}
                onClick={(e) => e.stopPropagation()}
              >
                <i className="bi bi-map"></i> View on Google Maps ↗
              </a>
            </div>
            {selectedAddressId === addr.id && <i className="bi bi-check-circle-fill text-danger fs-5"></i>}
          </label>
        ))}
      </div>

      {/* Add New Address Modal */}
      {showAddModal && (
        <ModalPortal isOpen={showAddModal}>
          <div 
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
            style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAddModal(false)}
          >
            <div 
              className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
              style={{ maxWidth: 500 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-address-title"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-extrabold text-dark mb-0" id="add-address-title">
                  Add Delivery Address
                </h5>
                <button type="button" className="btn-close touch-target" onClick={() => setShowAddModal(false)} aria-label="Close"></button>
              </div>

              <form onSubmit={handleCreateSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Address Tag</label>
                  <div className="d-flex gap-2">
                    {['Home', 'Work', 'Other'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`btn btn-sm rounded-pill px-3 py-1 touch-target ${
                          newAddress.title === tag ? 'btn-danger text-white fw-bold' : 'btn-light border'
                        }`}
                        onClick={() => setNewAddress({ ...newAddress, title: tag })}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Street Address / House No.</label>
                  <textarea
                    className="form-control rounded-3"
                    rows={2}
                    required
                    placeholder="e.g. Flat 304, Palm Grove Apartments, 5th Cross Road"
                    value={newAddress.addressLine}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                  ></textarea>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label small fw-bold">Landmark</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="e.g. Near Indiranagar Club"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold">Postal PIN Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="560038"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    />
                  </div>
                </div>

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
                    className="btn btn-sm btn-primary rounded-pill px-4 fw-bold touch-target text-white"
                    style={{ background: '#ff5722', borderColor: '#ff5722' }}
                  >
                    Save Address
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
