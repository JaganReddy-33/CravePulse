import React, { useState, useEffect } from 'react';
import ModalPortal from '../ModalPortal';
import { useCart } from '../../context/CartContext';

/**
 * ItemCustomizerModal: Item customization sheet for portions, add-ons, and special cooking instructions.
 */
const ItemCustomizerModal = ({ dish, restaurantName, show, onClose }) => {
  const { addItem } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (dish?.variants?.length > 0) {
      const def = dish.variants.find((v) => v.isDefault);
      return def ? def.id : dish.variants[0].id;
    }
    return null;
  });

  const [selectedAddons, setSelectedAddons] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (show) { setSelectedVariant(dish?.variants?.find(v => v.isDefault)?.id || dish?.variants?.[0]?.id || null); setSelectedAddons([]); setSpecialInstructions(''); }
  }, [show, dish]);
  if (!show || !dish) return null;

  const basePrice = Number(dish.platformPrice || dish.dineInPrice || dish.price || 0);
  const activeVariant = dish.variants?.find((v) => v.id === selectedVariant);
  const variantAdjustment = activeVariant ? Number(activeVariant.priceAdjustment || 0) : 0;

  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = dish.addons?.find((a) => a.id === addonId);
    return sum + (addon ? Number(addon.price || 0) : 0);
  }, 0);

  const finalPrice = basePrice + variantAdjustment + addonsTotal;

  const handleToggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleAddToCart = () => {
    const activeAddonsList = dish.addons?.filter((a) => selectedAddons.includes(a.id)) || [];

    addItem({ restaurantId: dish.restaurantId, restaurantName, item: dish, variant: activeVariant || null, addons: activeAddonsList, specialInstructions: specialInstructions.trim() });

    onClose();
  };

  return (
    <ModalPortal isOpen={show}>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center p-3"
        style={{ zIndex: 10050, backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-4 shadow-2xl p-4 w-100 animate-slide-left"
          style={{ maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="customizer-title"
        >
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="fw-extrabold text-dark mb-1" id="customizer-title">
                Customize {dish.name}
              </h5>
              <small className="text-muted">Choose your portion and favourite add-ons</small>
            </div>
            <button type="button" className="btn-close touch-target" onClick={onClose} aria-label="Close dialog"></button>
          </div>

          {/* Portion Variants */}
          {dish.variants?.length > 0 && (
            <div className="mb-4">
              <label className="fw-bold small text-dark d-block mb-2 text-uppercase" style={{ fontSize: 11 }}>
                Select Portion Size (Required)
              </label>
              <div className="d-flex flex-column gap-2">
                {dish.variants.map((v) => (
                  <label
                    key={v.id}
                    className={`d-flex justify-content-between align-items-center p-3 rounded-3 border cursor-pointer transition ${
                      selectedVariant === v.id ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="radio"
                        name="dishVariant"
                        checked={selectedVariant === v.id}
                        onChange={() => setSelectedVariant(v.id)}
                        className="form-check-input mt-0"
                      />
                      <span className="small fw-semibold text-dark">{v.variantName}</span>
                    </div>
                    <span className="small text-muted fw-bold">
                      {v.priceAdjustment > 0 ? `+₹${v.priceAdjustment}` : 'Included'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {dish.addons?.length > 0 && (
            <div className="mb-4">
              <label className="fw-bold small text-dark d-block mb-2 text-uppercase" style={{ fontSize: 11 }}>
                Complementary Add-ons (Optional)
              </label>
              <div className="d-flex flex-column gap-2">
                {dish.addons.map((a) => (
                  <label
                    key={a.id}
                    className={`d-flex justify-content-between align-items-center p-3 rounded-3 border cursor-pointer transition ${
                      selectedAddons.includes(a.id) ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedAddons.includes(a.id)}
                        onChange={() => handleToggleAddon(a.id)}
                        className="form-check-input mt-0"
                      />
                      <span className="small fw-semibold text-dark">{a.addonName}</span>
                    </div>
                    <span className="small text-danger fw-bold">+₹{a.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Special Cooking Instructions */}
          <div className="mb-4">
            <label className="fw-bold small text-dark d-block mb-1 text-uppercase" style={{ fontSize: 11 }}>
              Special Cooking Instructions
            </label>
            <textarea
              className="form-control rounded-3 border"
              rows={2}
              placeholder="e.g. Less spicy, no onions, extra napkins, cutlery required..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              maxLength={150}
            ></textarea>
            <small className="text-muted d-block text-end mt-1" style={{ fontSize: 10 }}>
              {specialInstructions.length}/150 characters
            </small>
          </div>

          {/* Modal Action Footer */}
          <div className="d-flex justify-content-between align-items-center pt-3 border-top">
            <div>
              <span className="text-muted small d-block" style={{ fontSize: 11 }}>Total Item Price</span>
              <span className="fs-4 fw-extrabold text-danger">₹{finalPrice}</span>
            </div>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold touch-target shadow hover-lift"
              style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}
              onClick={handleAddToCart}
            >
              Add Custom Item
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ItemCustomizerModal;
