import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants');
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(r => ({
          id: r.id,
          name: r.name,
          phone: r.phone || '+91 9876543210',
          cuisine: r.cuisineTypes || r.cuisine || 'Multi-Cuisine',
          fssai: r.fssaiLicense || r.fssai || 'FSSAI-VERIFIED',
          commission: r.commissionRate || r.commission || 15.00,
          rating: r.rating ?? 0,
          status: r.isKycApproved === false ? 'PENDING_AUDIT' : (r.isOpen ? 'ACTIVE' : 'PAUSED')
        }));
        setRestaurants(mapped);
      } else {
        setRestaurants([]);
      }
    } catch (e) {
      console.warn('Error fetching admin restaurants', e);
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = (id) => {
    setRestaurants(restaurants.map(r => r.id === id ? { ...r, status: r.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : r));
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-white">Merchant Directory & Commission Controls</h4>
          <p className="text-secondary small mb-0">Oversee onboarded culinary partners, FSSAI verification, and menu parity compliance</p>
        </div>

        <div style={{ maxWidth: 320 }} className="w-100">
          <input
            type="text"
            className="form-control bg-dark text-white border-secondary rounded-pill form-control-sm"
            placeholder="Search kitchen or cuisine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card border-0 rounded-4 p-4 text-white" style={{ background: '#111827', border: '1px solid #1f293d' }}>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr className="border-secondary text-secondary small">
                <th>Restaurant Name</th>
                <th>Cuisine Category</th>
                <th>FSSAI Certification</th>
                <th>Commission Tier</th>
                <th>Rating</th>
                <th>Platform Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rest) => (
                <tr key={rest.id} className="border-secondary">
                  <td>
                    <strong className="text-white d-block">{rest.name}</strong>
                    <small className="text-secondary">{rest.phone}</small>
                  </td>
                  <td className="small text-secondary">{rest.cuisine}</td>
                  <td className="small font-monospace text-light">{rest.fssai}</td>
                  <td>
                    <span className="badge bg-dark border border-secondary text-info">
                      {rest.commission}% Fair
                    </span>
                  </td>
                  <td>
                    <span className="text-warning fw-bold">★ {rest.rating}</span>
                  </td>
                  <td>
                    <span className={`badge ${rest.status === 'ACTIVE' ? 'bg-success text-dark' : rest.status === 'PENDING_AUDIT' ? 'bg-warning text-dark' : 'bg-danger text-white'} rounded-pill px-3`}>
                      {rest.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-light rounded-pill px-3 me-2"
                      onClick={() => toggleStatus(rest.id)}
                    >
                      {rest.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <a
                      href={`/restaurant/${rest.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-info rounded-pill px-3 text-dark fw-bold"
                    >
                      Audit Menu ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
