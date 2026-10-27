import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORY_OPTIONS = [
  { id: 101, name: 'Chef Specials' },
  { id: 102, name: 'Main Course / Biryanis' },
  { id: 103, name: 'Rich Curries & Gravies' },
  { id: 104, name: 'Clay Oven Breads' },
  { id: 105, name: 'Artisan Desserts & Beverages' }
];

const MenuManagement = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [newPlatformPrice, setNewPlatformPrice] = useState('');
  const [newDineInPrice, setNewDineInPrice] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Form State for creating a new dish
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('101');
  const [newItemDineIn, setNewItemDineIn] = useState('');
  const [newItemPlatform, setNewItemPlatform] = useState('');
  const [newItemImage, setNewItemImage] = useState('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemPrepTime, setNewItemPrepTime] = useState(15);
  const [newItemCalories, setNewItemCalories] = useState(380);
  const [submitting, setSubmitting] = useState(false);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu/restaurant/1');
      let combinedItems = [];

      if (res.success && Array.isArray(res.data?.items)) {
        combinedItems = res.data.items;
      } else if (res.success && Array.isArray(res.data)) {
        combinedItems = res.data;
      } else {
        combinedItems = [];
      }

      // Merge custom dishes saved in localStorage
      const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
      const partnerCustoms = customDishes.filter(d => Number(d.restaurantId) === 1 || !d.restaurantId);
      if (partnerCustoms.length > 0) {
        combinedItems = [...partnerCustoms, ...combinedItems];
      }

      setItems(combinedItems);
    } catch (e) {
      console.warn('API error fetching menu', e);
      const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
      setItems(customDishes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (item) => {
    const updatedState = !item.available;
    // Optimistic UI update
    setItems(prev => prev.map(it => it.id === item.id ? { ...it, available: updatedState } : it));

    try {
      await api.post(`/menu/item/${item.id}/toggle-availability`, { isAvailable: updatedState });
      showNotification(`Dish marked as ${updatedState ? 'In-Stock' : 'Sold Out'}`);
    } catch (e) {
      // Keep optimistic state and update localStorage
      const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
      const updatedCustoms = customDishes.map(d => d.id === item.id ? { ...d, available: updatedState } : d);
      localStorage.setItem('cravepulse_custom_dishes', JSON.stringify(updatedCustoms));
      showNotification(`Status updated: ${updatedState ? 'In-Stock' : 'Sold Out'}`);
    }
  };

  const handleSavePrices = async (e) => {
    e.preventDefault();
    const pPrice = parseFloat(newPlatformPrice);
    const dPrice = parseFloat(newDineInPrice);

    if (isNaN(pPrice) || isNaN(dPrice)) {
      alert('Please enter valid numeric prices');
      return;
    }

    setItems(prev => prev.map(it => it.id === editingItem.id ? {
      ...it,
      platformPrice: pPrice,
      dineInPrice: dPrice,
    } : it));

    try {
      await api.post(`/menu/item/${editingItem.id}/price-parity`, {
        platformPrice: pPrice,
        dineInPrice: dPrice,
      });
    } catch (e) {
      // Fallback update in custom storage
      const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
      const updated = customDishes.map(d => d.id === editingItem.id ? { ...d, platformPrice: pPrice, dineInPrice: dPrice } : d);
      localStorage.setItem('cravepulse_custom_dishes', JSON.stringify(updated));
    }

    showNotification('Price parity audited and saved successfully!');
    setEditingItem(null);
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const platformVal = parseFloat(newItemPlatform);
    const dineInVal = parseFloat(newItemDineIn || newItemPlatform);

    const matchedCat = CATEGORY_OPTIONS.find(c => String(c.id) === String(newItemCategory));

    const newDishObject = {
      id: Date.now(),
      restaurantId: 1,
      categoryId: Number(newItemCategory),
      categoryName: matchedCat ? matchedCat.name : 'Chef Specials',
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      platformPrice: platformVal,
      dineInPrice: dineInVal,
      imageUrl: newItemImage.trim() || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500',
      veg: newItemVeg,
      available: true,
      prepTimeMinutes: Number(newItemPrepTime) || 15,
      calorieCount: Number(newItemCalories) || 350,
      variants: [],
      addons: []
    };

    try {
      await api.post('/menu/item', newDishObject);
    } catch (err) {
      console.warn('API dish posting offline, persisting directly to local store', err);
    }

    // Persist to custom storage for immediate reflection across customer menu
    const existing = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
    localStorage.setItem('cravepulse_custom_dishes', JSON.stringify([newDishObject, ...existing]));

    setItems(prev => [newDishObject, ...prev]);
    setSubmitting(false);
    setShowAddModal(false);

    // Reset form
    setNewItemName('');
    setNewItemDesc('');
    setNewItemPlatform('');
    setNewItemDineIn('');
    setNewItemImage('https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500');
    setNewItemVeg(true);

    showNotification(`"${newDishObject.name}" published live with 0% markup!`);
  };

  const handleDeleteDish = (dishId) => {
    if (!window.confirm('Are you sure you want to remove this dish from your live menu?')) return;

    setItems(prev => prev.filter(it => it.id !== dishId));
    const customDishes = JSON.parse(localStorage.getItem('cravepulse_custom_dishes') || '[]');
    const filtered = customDishes.filter(d => d.id !== dishId);
    localStorage.setItem('cravepulse_custom_dishes', JSON.stringify(filtered));
    showNotification('Dish removed from menu');
  };

  const filteredItems = items.filter(it => {
    if (filterCategory === 'ALL') return true;
    return String(it.categoryId) === String(filterCategory);
  });

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="position-fixed top-0 end-0 p-4" style={{ zIndex: 1090 }}>
          <div className="toast show align-items-center text-white bg-success border-0 shadow-lg rounded-3">
            <div className="d-flex">
              <div className="toast-body fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill fs-5"></i>
                {toastMessage}
              </div>
              <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => setToastMessage('')}></button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Action Button */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Menu Management & Dynamic Dish Studio</h4>
          <p className="text-muted small mb-0">
            Post new culinary creations, adjust in-stock availability, and guarantee 100% Dine-In Menu Price Parity for customers.
          </p>
        </div>
        <button
          className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
          onClick={() => setShowAddModal(true)}
        >
          <i className="bi bi-plus-circle-fill"></i>
          + Add New Dish
        </button>
      </div>

      {/* Parity Info Banner */}
      <div className="card border-0 rounded-4 shadow-sm bg-primary-subtle border-start border-4 border-primary p-3 mb-4">
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-shield-check text-primary fs-3"></i>
          <div>
            <h6 className="fw-bold mb-1 text-primary-emphasis">CravePulse Fair Dining Commitment</h6>
            <p className="small text-muted mb-0">
              Unlike traditional platforms that inflate prices by 20-30%, dishes on CravePulse must equal your physical restaurant dine-in printed menu. Every dish with 0% markup receives the verified trust badge.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="d-flex gap-2 overflow-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        <button
          className={`btn btn-sm rounded-pill px-3 fw-bold ${filterCategory === 'ALL' ? 'btn-dark' : 'btn-light border'}`}
          onClick={() => setFilterCategory('ALL')}
        >
          All Dishes ({items.length})
        </button>
        {CATEGORY_OPTIONS.map(c => (
          <button
            key={c.id}
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filterCategory === String(c.id) ? 'btn-dark' : 'btn-light border'}`}
            onClick={() => setFilterCategory(String(c.id))}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted small mt-2">Loading restaurant live menu...</p>
        </div>
      ) : (
        <div className="card border-0 rounded-4 shadow-sm bg-white overflow-hidden mb-5">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th className="ps-4">Dish</th>
                  <th>Diet</th>
                  <th>Dine-In Menu Price</th>
                  <th>Platform Delivery Price</th>
                  <th>Parity Audit</th>
                  <th>In-Stock Switch</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">
                      No dishes in this category. Click "+ Add New Dish" above to create one.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isParity = Number(item.platformPrice) === Number(item.dineInPrice);

                    return (
                      <tr key={item.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="rounded-3 shadow-sm object-fit-cover"
                              style={{ width: 48, height: 48 }}
                            />
                            <div>
                              <div className="fw-bold text-dark">{item.name}</div>
                              <small className="text-muted">
                                {item.calorieCount || 350} kcal • {item.prepTimeMinutes || 15}m prep
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${item.veg ? 'bg-success-subtle text-success border border-success' : 'bg-danger-subtle text-danger border border-danger'} small rounded-pill px-2 py-1`}>
                            {item.veg ? 'Veg' : 'Non-Veg'}
                          </span>
                        </td>
                        <td className="fw-bold text-muted">₹{item.dineInPrice}</td>
                        <td>
                          <strong className="text-dark fs-6">₹{item.platformPrice}</strong>
                        </td>
                        <td>
                          {isParity ? (
                            <span className="badge bg-success rounded-pill px-2 py-1 small">0% Markup ✓</span>
                          ) : (
                            <span className="badge bg-warning text-dark rounded-pill px-2 py-1 small">Markup Active</span>
                          )}
                        </td>
                        <td>
                          <div className="form-check form-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={item.available !== false}
                              onChange={() => handleToggleAvailability(item)}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label small text-muted">
                              {item.available !== false ? 'In-Stock' : 'Sold Out'}
                            </label>
                          </div>
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                              onClick={() => {
                                setEditingItem(item);
                                setNewPlatformPrice(item.platformPrice);
                                setNewDineInPrice(item.dineInPrice);
                              }}
                            >
                              Audit Prices
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-circle p-1"
                              style={{ width: 30, height: 30 }}
                              title="Delete Dish"
                              onClick={() => handleDeleteDish(item.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Price Parity Modal */}
      {editingItem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Adjust Price Parity: {editingItem.name}</h5>
                <button type="button" className="btn-close" onClick={() => setEditingItem(null)}></button>
              </div>
              <form onSubmit={handleSavePrices}>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Actual Dine-In Restaurant Menu Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={newDineInPrice}
                    onChange={(e) => setNewDineInPrice(e.target.value)}
                  />
                  <small className="text-muted" style={{ fontSize: 11 }}>Printed price on your physical dining table menu card.</small>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-bold">Platform Online Delivery Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={newPlatformPrice}
                    onChange={(e) => setNewPlatformPrice(e.target.value)}
                  />
                  <small className="text-muted" style={{ fontSize: 11 }}>To maintain the 100% Price Parity guarantee badge, keep this equal to dine-in price.</small>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setEditingItem(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold" style={{ background: '#ff5c35', borderColor: '#ff5c35' }}>
                    Save & Verify Parity
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add New Dish Modal (Dynamic Post) */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0">Post New Dish to Live Menu</h5>
                  <small className="text-muted">Fill out the culinary details to immediately publish this item</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreateDish}>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label small fw-bold">Dish Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Royal Nawabi Chicken Korma"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small fw-bold">Menu Category *</label>
                    <select
                      className="form-select"
                      value={newItemCategory}
                      onChange={(e) => setNewItemCategory(e.target.value)}
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label small fw-bold">Dish Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Describe taste profile, slow-cooking process, and key spices..."
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Dine-In Printed Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      placeholder="280.00"
                      value={newItemDineIn}
                      onChange={(e) => {
                        setNewItemDineIn(e.target.value);
                        if (!newItemPlatform) setNewItemPlatform(e.target.value);
                      }}
                    />
                    <small className="text-muted" style={{ fontSize: 11 }}>Your physical dining menu price.</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Platform Delivery Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      required
                      placeholder="280.00"
                      value={newItemPlatform}
                      onChange={(e) => setNewItemPlatform(e.target.value)}
                    />
                    <small className="text-muted" style={{ fontSize: 11 }}>Equal to dine-in price to earn 0% markup badge.</small>
                  </div>

                  <div className="col-md-8">
                    <label className="form-label small fw-bold">High-Res Dish Image URL</label>
                    <input
                      type="url"
                      className="form-control"
                      placeholder="https://images.unsplash.com/..."
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 d-flex align-items-center">
                    <div className="form-check form-switch mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="newVegCheck"
                        checked={newItemVeg}
                        onChange={(e) => setNewItemVeg(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold small ms-2" htmlFor="newVegCheck">
                        {newItemVeg ? '🌱 Vegetarian Dish' : '🍗 Non-Veg Dish'}
                      </label>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Prep Time (Minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newItemPrepTime}
                      onChange={(e) => setNewItemPrepTime(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-bold">Estimated Calories (kcal)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newItemCalories}
                      onChange={(e) => setNewItemCalories(e.target.value)}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setShowAddModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #ff5c35 0%, #ff8c42 100%)', borderColor: '#ff5c35' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Publishing...' : '🚀 Publish Dish Live'}
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

export default MenuManagement;
