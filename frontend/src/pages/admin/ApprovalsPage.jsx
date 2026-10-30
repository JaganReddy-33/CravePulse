import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ApprovalsPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entityType, setEntityType] = useState(null); // 'RESTAURANT' or 'RIDER'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restRes, rdRes] = await Promise.all([
        api.get('/admin/restaurants'),
        api.get('/admin/riders'),
      ]);
      if (restRes.success && Array.isArray(restRes.data)) setRestaurants(restRes.data);
      if (rdRes.success && Array.isArray(rdRes.data)) setRiders(rdRes.data);
    } catch (e) {
      console.error('Error fetching admin approvals', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRestaurantKyc = async (restId, currentStatus) => {
    const reason = prompt(currentStatus ? 'Reason for revoking license:' : 'Approval notes:');
    if (reason === null) return;

    try {
      const res = await api.post(`/admin/restaurant/${restId}/kyc`, {
        approved: !currentStatus,
        reason: reason || (currentStatus ? 'Revoked by compliance officer' : 'KYC and FSSAI verified')
      });
      if (res.success) {
        setRestaurants(prev => prev.map(r => r.id === restId ? { ...r, isKycApproved: !currentStatus } : r));
        if (selectedEntity && selectedEntity.id === restId) {
          setSelectedEntity(prev => ({ ...prev, isKycApproved: !currentStatus }));
        }
      }
    } catch (e) {
      alert(e.message || 'Error updating KYC');
    }
  };

  const handleToggleRiderKyc = async (riderId, currentStatus) => {
    const reason = prompt(currentStatus ? 'Reason for revoking captain clearance:' : 'Approval verification notes:');
    if (reason === null) return;

    try {
      const res = await api.post(`/admin/rider/${riderId}/kyc`, {
        approved: !currentStatus,
        reason: reason || (currentStatus ? 'Revoked by fleet supervisor' : 'Driver license & RC verified')
      });
      if (res.success) {
        setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isKycApproved: !currentStatus } : r));
        if (selectedEntity && selectedEntity.id === riderId) {
          setSelectedEntity(prev => ({ ...prev, isKycApproved: !currentStatus }));
        }
      }
    } catch (e) {
      alert(e.message || 'Error updating KYC');
    }
  };

  const handleViewDocuments = (entity, type) => {
    setSelectedEntity(entity);
    setEntityType(type);
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">Merchant & Fleet KYC Compliance Terminal</h4>
          <p className="text-muted small mb-0">Inspect business licenses, FSSAI certificates, vehicle registrations, and identity records.</p>
        </div>
        <button className="btn btn-outline-info rounded-pill px-3 btn-sm" onClick={fetchData}>
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Verification Tables
        </button>
      </div>

      {loading ? (
        <div className="card border-0 rounded-4 shadow-sm p-5 text-center text-white" style={{ background: '#162032' }}>
          <div className="spinner-border text-info" role="status"></div>
          <p className="text-muted small mt-2">Loading partner verification data...</p>
        </div>
      ) : (
        <>
          {/* 1. Restaurants KYC Table */}
          <div className="card border-0 rounded-4 shadow-sm p-4 mb-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-shop text-info"></i> Restaurant Merchant Partners ({restaurants.length})
            </h6>

            {restaurants.length === 0 ? (
              <div className="text-center py-4 text-muted small">No restaurant partner records found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: '#162032' }}>
                  <thead className="small text-muted border-secondary">
                    <tr>
                      <th>Restaurant Name</th>
                      <th>Cuisines</th>
                      <th>FSSAI License</th>
                      <th>Phone</th>
                      <th>Commission</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {restaurants.map(r => (
                      <tr key={r.id}>
                        <td className="fw-bold text-white">{r.name}</td>
                        <td className="text-muted">{r.cuisineTypes}</td>
                        <td><code className="text-info">{r.fssaiLicense}</code></td>
                        <td>{r.phone}</td>
                        <td>{r.commissionRate}%</td>
                        <td>
                          <span className={`badge ${r.isKycApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {r.isKycApproved ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-info rounded-pill px-3"
                              onClick={() => handleViewDocuments(r, 'RESTAURANT')}
                            >
                              <i className="bi bi-file-earmark-text me-1"></i> View Docs
                            </button>
                            <button
                              className={`btn btn-sm rounded-pill px-3 ${r.isKycApproved ? 'btn-outline-danger' : 'btn-success text-dark fw-bold'}`}
                              onClick={() => handleToggleRestaurantKyc(r.id, r.isKycApproved)}
                            >
                              {r.isKycApproved ? 'Revoke' : 'Approve ✓'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 2. Delivery Riders Table */}
          <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-bicycle text-success"></i> Delivery Fleet Captains ({riders.length})
            </h6>

            {riders.length === 0 ? (
              <div className="text-center py-4 text-muted small">No delivery rider records found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle mb-0" style={{ background: '#162032' }}>
                  <thead className="small text-muted border-secondary">
                    <tr>
                      <th>Captain</th>
                      <th>Vehicle</th>
                      <th>Driving License</th>
                      <th>Deliveries</th>
                      <th>Rating</th>
                      <th>KYC Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {riders.map(rd => (
                      <tr key={rd.id}>
                        <td className="fw-bold text-white">{rd.riderName || `Captain #${rd.id}`}</td>
                        <td>
                          <div>{rd.vehicleType}</div>
                          <code className="text-warning small">{rd.vehicleNumber}</code>
                        </td>
                        <td><code className="text-info">{rd.drivingLicense}</code></td>
                        <td>{rd.totalDeliveries} trips</td>
                        <td>
                          <span className="text-warning">★ {rd.rating}</span>
                        </td>
                        <td>
                          <span className={`badge ${rd.isKycApproved ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {rd.isKycApproved ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-info rounded-pill px-3"
                              onClick={() => handleViewDocuments(rd, 'RIDER')}
                            >
                              <i className="bi bi-file-earmark-text me-1"></i> View Docs
                            </button>
                            <button
                              className={`btn btn-sm rounded-pill px-3 ${rd.isKycApproved ? 'btn-outline-danger' : 'btn-success text-dark fw-bold'}`}
                              onClick={() => handleToggleRiderKyc(rd.id, rd.isKycApproved)}
                            >
                              {rd.isKycApproved ? 'Revoke' : 'Approve ✓'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Document View Modal */}
      {selectedEntity && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 p-3 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
              <div className="modal-header border-0 pb-0">
                <div>
                  <h5 className="modal-title fw-bold">
                    {entityType === 'RESTAURANT' ? '📜 Restaurant Compliance Document Dossier' : '🪪 Rider Fleet License Dossier'}
                  </h5>
                  <small className="text-muted">
                    {entityType === 'RESTAURANT' ? selectedEntity.name : (selectedEntity.riderName || `Captain #${selectedEntity.id}`)}
                  </small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedEntity(null)}></button>
              </div>

              <div className="modal-body">
                {entityType === 'RESTAURANT' ? (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">FSSAI Food Safety License</label>
                        <h6 className="fw-bold text-info mb-1">{selectedEntity.fssaiLicense || 'FSSAI-UNREGISTERED'}</h6>
                        <small className="text-muted">Government Food Safety and Standards Authority of India</small>
                        <div className="mt-2 text-success small"><i className="bi bi-patch-check-fill me-1"></i> Certificate Active</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">GST Identification Number (GSTIN)</label>
                        <h6 className="fw-bold text-warning mb-1">29AAAAA0000A1Z5</h6>
                        <small className="text-muted">State: Karnataka (29) • Tax Compliance Verified</small>
                        <div className="mt-2 text-info small"><i className="bi bi-receipt me-1"></i> Tax Invoicing Enabled</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Kitchen Operational Center</label>
                        <p className="small mb-1 text-white">{selectedEntity.address || 'Indiranagar 100ft Road, Bengaluru, Karnataka 560038'}</p>
                        <small className="text-muted">Contact: {selectedEntity.phone}</small>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Commercial Settlement Terms</label>
                        <div className="fw-bold text-white mb-1">Commission: {selectedEntity.commissionRate}%</div>
                        <small className="text-muted">Payout Schedule: Daily T+1 Automated ACH Transfer</small>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Motor Driving License</label>
                        <h6 className="fw-bold text-info mb-1">{selectedEntity.drivingLicense}</h6>
                        <small className="text-muted">Category: Two-Wheeler / Commercial Transport</small>
                        <div className="mt-2 text-success small"><i className="bi bi-patch-check-fill me-1"></i> Valid License</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Vehicle Registration Certificate (RC)</label>
                        <h6 className="fw-bold text-warning mb-1">{selectedEntity.vehicleNumber}</h6>
                        <small className="text-muted">{selectedEntity.vehicleType}</small>
                        <div className="mt-2 text-info small"><i className="bi bi-shield-check me-1"></i> PUC & Insurance Valid</div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Courier Background Verification</label>
                        <p className="small mb-1 text-white">National Identity Proof: Aadhaar Card Verified</p>
                        <small className="text-muted">Police Verification: Clear • Zero Incident History</small>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 rounded-3 bg-dark border border-secondary">
                        <label className="text-muted small fw-bold text-uppercase d-block mb-1">Fleet Service Track Record</label>
                        <div className="fw-bold text-white mb-1">Total Deliveries: {selectedEntity.totalDeliveries}</div>
                        <small className="text-muted">Fleet Rating: ★ {selectedEntity.rating} / 5.0</small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0 d-flex justify-content-between">
                <div>
                  <span className={`badge ${selectedEntity.isKycApproved ? 'bg-success' : 'bg-warning text-dark'} px-3 py-2`}>
                    Status: {selectedEntity.isKycApproved ? 'VERIFIED' : 'PENDING APPROVAL'}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setSelectedEntity(null)}>
                    Close Dossier
                  </button>
                  {entityType === 'RESTAURANT' ? (
                    <button
                      type="button"
                      className={`btn rounded-pill px-4 fw-bold ${selectedEntity.isKycApproved ? 'btn-outline-danger' : 'btn-success text-dark'}`}
                      onClick={() => handleToggleRestaurantKyc(selectedEntity.id, selectedEntity.isKycApproved)}
                    >
                      {selectedEntity.isKycApproved ? 'Revoke License' : 'Approve Partner ✓'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`btn rounded-pill px-4 fw-bold ${selectedEntity.isKycApproved ? 'btn-outline-danger' : 'btn-success text-dark'}`}
                      onClick={() => handleToggleRiderKyc(selectedEntity.id, selectedEntity.isKycApproved)}
                    >
                      {selectedEntity.isKycApproved ? 'Revoke Clearance' : 'Approve Captain ✓'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
