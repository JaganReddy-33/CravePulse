import React from 'react';
import { useCart } from '../../context/CartContext';

/**
 * DishCard: Menu item card showcasing price parity, dietary flags, and cart steppers.
 */
const DishCard = ({ dish, restaurantName, onCustomize, isStoreClosed }) => {
  const { cart, addItem, removeItem } = useCart();

  // Check if item is currently in cart
  const cartItem = cart.items.find((it) => it.id === dish.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const hasCustomizations = (dish.variants && dish.variants.length > 0) || (dish.addons && dish.addons.length > 0);

  const handleAddClick = () => {
    if (isStoreClosed) return;
    if (hasCustomizations && onCustomize) {
      onCustomize(dish);
    } else {
      addItem({ restaurantId: dish.restaurantId, restaurantName, item: dish });
    }
  };

  return (
    <div className="card border-0 rounded-4 shadow-sm p-3 bg-white h-100 d-flex flex-column justify-content-between hover-lift transition">
      <div>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          {/* Veg / Non-Veg Indicator */}
          <div 
            className="border p-1 rounded-1 d-inline-flex align-items-center justify-content-center"
            style={{ 
              width: 18, 
              height: 18, 
              borderColor: dish.veg || dish.isVeg ? '#10b981' : '#ef4444' 
            }}
            title={dish.veg || dish.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          >
            <div 
              className="rounded-circle"
              style={{ 
                width: 8, 
                height: 8, 
                backgroundColor: dish.veg || dish.isVeg ? '#10b981' : '#ef4444' 
              }}
            ></div>
          </div>

          {/* Dine-In Parity Tag */}
          <span 
            className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"
            style={{ fontSize: 10 }}
          >
            0% Markup Parity
          </span>
        </div>

        <h6 className="fw-bold text-dark mb-1">{dish.name}</h6>

        {/* Pricing */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="fs-5 fw-extrabold text-dark">
            ₹{dish.platformPrice || dish.dineInPrice || dish.price}
          </span>
          {dish.dineInPrice && dish.platformPrice && Number(dish.dineInPrice) === Number(dish.platformPrice) && (
            <small className="text-muted text-decoration-line-through small" style={{ fontSize: 11 }}>
              ₹{Math.round(dish.platformPrice * 1.25)} standard apps
            </small>
          )}
        </div>

        <p className="text-muted small mb-3 text-truncate-2" style={{ fontSize: 12 }}>
          {dish.description}
        </p>

        {dish.prepTimeMinutes && (
          <small className="text-secondary d-block mb-3" style={{ fontSize: 11 }}>
            <i className="bi bi-clock me-1 text-danger"></i>
            Prep: ~{dish.prepTimeMinutes} mins {dish.calorieCount ? `• ${dish.calorieCount} kcal` : ''}
          </small>
        )}
      </div>

      {/* Dish Image & Cart Controls */}
      <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
        <div className="position-relative" style={{ width: 100, height: 75 }}>
          <img
            src={dish.imageUrl || '/food-placeholder.svg'}
            alt={dish.name}
            className="w-100 h-100 rounded-3 object-fit-cover shadow-xs"
            loading="lazy"
          />
        </div>

        <div>
          {isStoreClosed ? (
            <button className="btn btn-sm btn-secondary rounded-pill px-3 py-1 small fw-bold" disabled>
              Closed
            </button>
          ) : quantity > 0 && !hasCustomizations ? (
            <div className="input-group input-group-sm rounded-pill border overflow-hidden shadow-xs" style={{ width: 95 }}>
              <button
                type="button"
                className="btn btn-light border-0 fw-bold px-2 touch-target"
                onClick={() => removeItem(cartItem?.cartKey)}
                aria-label={`Decrease quantity of ${dish.name}`}
              >
                -
              </button>
              <span className="form-control text-center bg-white border-0 fw-bold small p-0 d-flex align-items-center justify-content-center">
                {quantity}
              </span>
              <button
                type="button"
                className="btn btn-light border-0 fw-bold px-2 touch-target text-danger"
                onClick={handleAddClick}
                aria-label={`Increase quantity of ${dish.name}`}
              >
                +
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger rounded-pill px-4 py-2 fw-bold touch-target shadow-xs hover-lift"
              onClick={handleAddClick}
            >
              ADD {hasCustomizations ? '+' : ''}
            </button>
          )}
          {hasCustomizations && (
            <small className="text-muted d-block text-center mt-1" style={{ fontSize: 10 }}>
              Customizable
            </small>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishCard;
