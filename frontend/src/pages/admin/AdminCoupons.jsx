import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: 1000,
    validUntil: '',
    isActive: true,
    firstOrderOnly: false
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/coupons');
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else {
        setCoupons([]);
      }
    } catch (e) {
      console.error('Error fetching coupons', e);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '199',
      maxDiscountAmount: '150',
      usageLimit: 1000,
      validUntil: '',
      isActive: true,
      firstOrderOnly: false
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (c) => {
    setEditingCoupon(c);
    setFormData({
      code: c.code,
      description: c.description,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscountAmount: c.maxDiscountAmount,
      usageLimit: c.usageLimit,
      validUntil: c.validUntil ? c.validUntil.replace(' ', 'T').substring(0, 16) : '',
      isActive: c.isActive,
      firstOrderOnly: c.firstOrderOnly || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.description || !formData.discountValue) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount || 0),
        maxDiscountAmount: Number(formData.maxDiscountAmount || 500),
        usageLimit: Number(formData.usageLimit || 1000),
      };

      if (editingCoupon) {
        const res = await api.post(`/admin/coupons/${editingCoupon.id}/update`, payload);
        if (res.success) {
          setShowModal(false);
          fetchCoupons();
        }
      } else {
        const res = await api.post('/admin/coupons', payload);
        if (res.success) {
          setShowModal(false);
          fetchCoupons();
        }
      }
    } catch (err) {
      alert(err.message || 'Error saving coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      const res = await api.post(`/admin/coupons/${couponId}/toggle`, { isActive: !currentStatus });
      if (res.success) {
        setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, isActive: !currentStatus } : c));
      }
    } catch (err) {
      alert(err.message || 'Error updating coupon');
    }
  };

  const handleDelete = async (couponId, code) => {
    if (!window.confirm(`Permanently delete coupon "${code}"?`)) return;
    try {
      const res = await api.delete(`/admin/coupons/${couponId}`);
      if (res.success) {
        setCoupons(prev => prev.filter(c => c.id !== couponId));
      }
    } catch (err) {
      alert(err.message || 'Error deleting coupon');
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-white">Promotional Coupon Management</h4>
          <p className="text-muted small mb-0">Create, configure, and monitor customer promo codes, discount limits, and campaigns.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-info rounded-pill px-3 btn-sm" onClick={fetchCoupons}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
          <button className="btn btn-success text-dark fw-bold rounded-pill px-4 btn-sm" onClick={handleOpenCreateModal}>
            <i className="bi bi-plus-lg me-1"></i> New Coupon
          </button>
        </div>
      </div>

      <div className="card border-0 rounded-4 shadow-sm p-4 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status"></div>
            <p className="text-muted small mt-2">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-5">
            <div className="fs-1 text-muted mb-2"><i className="bi bi-ticket-perforated"></i></div>
            <h6 className="fw-bold">No Active Coupons</h6>
            <p className="text-muted small">Click "New Coupon" to launch your first promotional offer.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover align-middle mb-0" style={{ background: '#162032' }}>
              <thead className="small text-muted border-secondary">
                <tr>
                  <th>Code</th>
                  <th>Offer Details</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Max Cap</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {coupons.map(c => (
                  <tr key={c.id}>
                    <td>
                      <code className="text-warning fs-6 fw-bold px-2 py-1 bg-dark rounded">{c.code}</code>
                      {c.firstOrderOnly && (
                        <span className="badge bg-primary-subtle text-primary ms-2">New Users</span>
                      )}
                    </td>
                    <td className="text-secondary" style={{ maxWidth: 260 }}>{c.description}</td>
                    <td>
                      <span className="fw-bold text-white">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                      </span>
                    </td>
                    <td>₹{c.minOrderAmount}</td>
                    <td>₹{c.maxDiscountAmount}</td>
                    <td>
                      <span className="text-muted">{c.timesUsed} / {c.usageLimit}</span>
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {c.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-info rounded-pill px-2 py-1"
                          onClick={() => handleOpenEditModal(c)}
                          title="Edit Coupon"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn btn-sm rounded-pill px-2 py-1 ${c.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggleStatus(c.id, c.isActive)}
                          title={c.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                        >
                          <i className={`bi ${c.isActive ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                          onClick={() => handleDelete(c.id, c.code)}
                          title="Delete Coupon"
                        >
                          <i className="bi bi-trash"></i>
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

      {/* Create / Edit Coupon Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 p-3 text-white" style={{ background: '#162032', border: '1px solid #1f293d' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Coupon Code *</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white text-uppercase fw-bold"
                      placeholder="e.g. MONSOON50"
                      value={formData.code}
                      disabled={!!editingCoupon}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold">Description *</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="e.g. 50% OFF up to ₹150 on orders above ₹199"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Discount Type</label>
                      <select
                        className="form-select bg-dark border-secondary text-white"
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FLAT">Flat (₹)</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-bold">Discount Value *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control bg-dark border-secondary text-white"
                        placeholder="50"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Min Order (₹)</label>
                      <input
                        type="number"
                        className="form-control bg-dark border-secondary text-white"
                        placeholder="199"
                        value={formData.minOrderAmount}
                        onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-bold">Max Cap (₹)</label>
                      <input
                        type="number"
                        className="form-control bg-dark border-secondary text-white"
                        placeholder="150"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold">Usage Limit</label>
                      <input
                        type="number"
                        className="form-control bg-dark border-secondary text-white"
                        placeholder="1000"
                        value={formData.usageLimit}
                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      />
                    </div>

                    <div className="col-6 d-flex flex-column justify-content-center">
                      <div className="form-check form-switch mt-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="firstOrderOnly"
                          checked={formData.firstOrderOnly}
                          onChange={(e) => setFormData({ ...formData, firstOrderOnly: e.target.checked })}
                        />
                        <label className="form-check-label small" htmlFor="firstOrderOnly">
                          First Order Only
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success text-dark fw-bold rounded-pill px-4"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
