import React from 'react';

/**
 * CheckoutOrderSummary: Cart item review with restaurant banner and quantity steppers.
 */
const CheckoutOrderSummary = ({
  cart,
  onAddItem,
  onRemoveItem,
  specialInstructions,
  setSpecialInstructions,
}) => {
  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-extrabold text-dark mb-0">
          <i className="bi bi-basket-fill text-danger me-2"></i>
          Order Summary
        </h5>
        <span className="badge bg-light text-muted border">
          {cart.restaurantName || 'Selected Kitchen'}
        </span>
      </div>

      {/* Items List */}
      <div className="d-flex flex-column gap-3 mb-3">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="d-flex justify-content-between align-items-center p-2 rounded-3 bg-light"
          >
            <div className="d-flex align-items-center gap-2 text-truncate">
              <span
                className={`badge ${item.isVeg ? 'bg-success' : 'bg-danger'} p-1 rounded-circle`}
                style={{ width: 8, height: 8 }}
              ></span>
              <div className="text-truncate">
                <strong className="d-block small text-dark text-truncate">{item.name}</strong>
                <small className="text-muted" style={{ fontSize: 11 }}>
                  ₹{item.price} each
                  {item.selectedVariant ? ` • ${item.selectedVariant}` : ''}
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="input-group input-group-sm rounded-pill border overflow-hidden bg-white shadow-xs" style={{ width: 84 }}>
                <button
                  type="button"
                  className="btn btn-light border-0 fw-bold px-2 touch-target"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="form-control text-center bg-transparent border-0 fw-bold small p-0 d-flex align-items-center justify-content-center">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  className="btn btn-light border-0 fw-bold px-2 touch-target text-danger"
                  onClick={() => onAddItem(item)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <strong className="small text-dark" style={{ minWidth: 60, textAlign: 'right' }}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Instructions Field */}
      <div>
        <label htmlFor="deliveryInstructionsInput" className="form-label small fw-bold text-muted mb-1">
          <i className="bi bi-chat-left-dots me-1"></i> Delivery Partner Instructions
        </label>
        <input
          id="deliveryInstructionsInput"
          type="text"
          className="form-control form-control-sm rounded-3"
          placeholder="e.g. Leave at security gate, ring doorbell twice, call on arrival..."
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
        />
      </div>
    </div>
  );
};

export default CheckoutOrderSummary;
