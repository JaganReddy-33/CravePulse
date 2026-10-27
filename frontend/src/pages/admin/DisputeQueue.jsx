import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DisputeQueue = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes/pending');
      if (res.success && Array.isArray(res.data)) {
        setDisputes(res.data);
      } else {
        setDisputes([]);
      }
    } catch (e) {
      console.warn('Error fetching disputes', e);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (disputeId, approve) => {
    const notes = prompt(approve ? 'Enter resolution approval note:' : 'Enter reason for rejection:');
    if (notes === null) return;

    try {
      const res = await api.post(`/disputes/${disputeId}/resolve`, {
        approve,
        notes: notes || (approve ? 'Approved by ops supervisor' : 'Insufficient photo evidence'),
      });
      if (res.success) {
        fetchDisputes();
      }
    } catch (e) {
      alert(e.message || 'Error resolving dispute');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">Instant Dispute Resolution Queue</h4>
          <p className="text-muted small mb-0">Audit photo evidence for missing/spoiled food and approve wallet compensation.</p>
        </div>
        <button className="btn btn-outline-info rounded-pill px-3 btn-sm" onClick={fetchDisputes}>
          Refresh Queue
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
        </div>
      ) : disputes.length === 0 ? (
        <div className="card border-0 rounded-4 p-5 text-center text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
          <div className="fs-1 mb-2">🎉</div>
          <h5 className="fw-bold">No Pending Escalations</h5>
          <p className="text-muted small">All customer disputes have been resolved or handled by our automated refund tiers.</p>
        </div>
      ) : (
        <div className="row g-4">
          {disputes.map(disp => (
            <div key={disp.id} className="col-12 col-xl-6">
              <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-danger rounded-pill px-3 py-1 mb-2">{disp.issueType}</span>
                    <h5 className="fw-bold mb-0 text-white">{disp.orderNumber}</h5>
                    <small className="text-muted">Customer: {disp.customerName} • {disp.restaurantName}</small>
                  </div>
                  <div className="text-end">
                    <span className="small text-muted d-block">Requested Claim</span>
                    <span className="fs-5 fw-extrabold text-warning">₹{disp.requestedRefundAmount}</span>
                  </div>
                </div>

                <div className="p-3 rounded-3 mb-3 small" style={{ background: '#0b0f19' }}>
                  <strong>Customer Statement:</strong>
                  <p className="mb-0 text-secondary mt-1">{disp.description}</p>
                </div>

                {/* Photo evidence preview */}
                {disp.photoEvidenceUrl && (
                  <div className="mb-3 d-flex align-items-center gap-3">
                    <img
                      src={disp.photoEvidenceUrl}
                      alt="Dispute evidence"
                      className="rounded-3 border border-secondary shadow-sm cursor-pointer"
                      style={{ width: 80, height: 80, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => setPreviewPhoto(disp.photoEvidenceUrl)}
                    />
                    <div>
                      <span className="small fw-bold d-block text-light">Customer Photo Evidence</span>
                      <small className="text-muted">Click photo to expand. Verified packaging seal inspection.</small>
                    </div>
                  </div>
                )}

                {/* Status or Action buttons */}
                <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-dark">
                  <span className={`badge ${disp.adminStatus === 'APPROVED' ? 'bg-success' : disp.adminStatus === 'REJECTED' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                    {disp.adminStatus}
                  </span>

                  {disp.adminStatus === 'PENDING' ? (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-danger rounded-pill px-3"
                        onClick={() => handleResolve(disp.id, false)}
                      >
                        Reject Claim
                      </button>
                      <button
                        className="btn btn-sm btn-success rounded-pill px-4 fw-bold text-dark"
                        style={{ background: '#00e676', borderColor: '#00e676' }}
                        onClick={() => handleResolve(disp.id, true)}
                      >
                        Approve ₹{disp.requestedRefundAmount} Refund ✓
                      </button>
                    </div>
                  ) : (
                    <small className="text-muted">{disp.resolutionNotes}</small>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded photo lightbox */}
      {previewPhoto && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060 }} onClick={() => setPreviewPhoto(null)}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-transparent border-0 text-center">
              <img src={previewPhoto} alt="Expanded evidence" className="img-fluid rounded-4 shadow-lg mx-auto" style={{ maxHeight: '80vh' }} />
              <button className="btn btn-light rounded-pill px-4 mt-3 mx-auto" onClick={() => setPreviewPhoto(null)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeQueue;
