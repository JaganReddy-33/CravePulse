import { setPreference } from '../../services/preferences';
import React from 'react';
import ModalPortal from '../ModalPortal';
import { PAN_INDIA_CITIES } from '../../config/panIndiaLocations';

/**
 * NavLocationModal: Multi-City location selector with GPS lock and search filter.
 */
const NavLocationModal = ({
  show,
  onClose,
  selectedCity,
  setSelectedCity,
  selectedHub,
  setSelectedHub,
  locationSearch,
  setLocationSearch,
  detectingGps,
  handleDetectGps,
}) => {
  if (!show) return null;

  const allFilteredHubs = [];
  PAN_INDIA_CITIES.forEach((city) => {
    city.hubs.forEach((h) => {
      if (
        !locationSearch ||
        h.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
        h.area.toLowerCase().includes(locationSearch.toLowerCase()) ||
        city.name.toLowerCase().includes(locationSearch.toLowerCase())
      ) {
        allFilteredHubs.push({ ...h, city });
      }
    });
  });

  return (
    <ModalPortal isOpen={show}>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
          style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-dialog-title"
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-extrabold mb-0 text-dark" id="location-dialog-title">
              Select Delivery Location
            </h5>
            <button type="button" className="btn-close touch-target" onClick={onClose} aria-label="Close dialog"></button>
          </div>

          {/* GPS Auto-Detect Button */}
          <button
            type="button"
            className="btn btn-outline-danger w-100 py-3 rounded-4 d-flex align-items-center justify-content-center gap-2 mb-3 fw-bold touch-target"
            onClick={handleDetectGps}
            disabled={detectingGps}
          >
            {detectingGps ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status"></span>
                <span>Locking High-Accuracy GPS...</span>
              </>
            ) : (
              <>
                <i className="bi bi-crosshair fs-5"></i>
                <span>Use Current Live GPS Pinpoint</span>
              </>
            )}
          </button>

          {/* Location search input */}
          <div className="input-group rounded-pill border mb-3 overflow-hidden shadow-sm">
            <span className="input-group-text bg-white border-0 ps-3">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 py-2"
              placeholder="Search locality, hub, or city (e.g. Indiranagar, HSR, Mumbai)..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              aria-label="Filter locations"
            />
          </div>

          {/* Cities horizontal chips */}
          <div className="mb-3">
            <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: 10 }}>
              Major Metros & Hubs
            </small>
            <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {PAN_INDIA_CITIES.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  className={`btn btn-sm rounded-pill px-3 py-1 text-nowrap fw-semibold touch-target ${
                    selectedCity.id === city.id ? 'btn-danger text-white' : 'btn-light border text-dark'
                  }`}
                  onClick={() => {
                    setSelectedCity(city);
                    setSelectedHub(city.hubs[0]);
                    setPreference('hub', city.hubs[0]);
                    onClose();
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          {/* Locality list */}
          <div className="d-flex flex-column gap-2" style={{ maxHeight: 260, overflowY: 'auto' }}>
            {allFilteredHubs.slice(0, 15).map((hub) => (
              <button
                key={`${hub.city.id}-${hub.id}`}
                type="button"
                className={`btn text-start p-3 rounded-3 border d-flex justify-content-between align-items-center hover-bg-light transition ${
                  selectedHub?.id === hub.id ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
                }`}
                onClick={() => {
                  setSelectedCity(hub.city);
                  setSelectedHub(hub);
                  setPreference('hub', hub);
                  onClose();
                }}
              >
                <div>
                  <div className="fw-bold small text-dark">{hub.name}</div>
                  <small className="text-muted">{hub.area} • {hub.city.name}</small>
                </div>
                {selectedHub?.id === hub.id && <i className="bi bi-check-circle-fill text-danger"></i>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default NavLocationModal;
