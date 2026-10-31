import React, { useState } from "react";
import { useCart } from "../../context/CartContext";

const DishCard = ({ dish, restaurantName, onCustomize, isStoreClosed }) => {
  const { cart, addItem, removeItem } = useCart();
  const [imageFailed, setImageFailed] = useState(!dish.imageUrl);

  const cartItem = cart.items.find((item) => item.id === dish.id);
  const quantity = cartItem?.quantity || 0;
  const hasCustomizations =
    (dish.variants && dish.variants.length > 0) ||
    (dish.addons && dish.addons.length > 0);
  const price = dish.platformPrice ?? dish.dineInPrice ?? dish.price;
  const hasPrice =
    price !== null &&
    price !== undefined &&
    price !== "" &&
    Number.isFinite(Number(price));
  const isUnavailable = dish.isAvailable === false || dish.available === false;
  const isVegetarian =
    typeof dish.veg === "boolean"
      ? dish.veg
      : typeof dish.isVeg === "boolean"
        ? dish.isVeg
        : null;

  const handleAddClick = () => {
    if (isStoreClosed || isUnavailable || !hasPrice) return;
    if (hasCustomizations && onCustomize) {
      onCustomize(dish);
    } else {
      addItem({ restaurantId: dish.restaurantId, restaurantName, item: dish });
    }
  };

  return (
    <article
      className="card border rounded-4 shadow-sm p-3 bg-white h-100 transition"
      style={{ borderColor: "#e7e1d9", minWidth: 0 }}
    >
      <div className="d-flex gap-3 h-100">
        <div
          className="position-relative flex-shrink-0 rounded-3 overflow-hidden"
          style={{
            width: "clamp(92px, 24vw, 128px)",
            minHeight: 112,
            alignSelf: "stretch",
            background: "#f3eee8",
          }}
        >
          {dish.imageUrl && !imageFailed ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="w-100 h-100 object-fit-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="h-100 d-flex flex-column align-items-center justify-content-center gap-1 text-secondary p-2 text-center"
              role="img"
              aria-label={`${dish.name}: image unavailable`}
            >
              <i className="bi bi-egg-fried fs-3" aria-hidden="true"></i>
              <span className="small">Image unavailable</span>
            </div>
          )}
        </div>

        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-start justify-content-between gap-2 mb-1">
            <h3
              className="h6 fw-bold text-dark mb-0"
              style={{ lineHeight: 1.3, overflowWrap: "anywhere" }}
            >
              {dish.name}
            </h3>
            {isVegetarian !== null && (
              <span
                className={`badge flex-shrink-0 ${isVegetarian ? "bg-success-subtle text-success border border-success-subtle" : "bg-light text-secondary border"}`}
              >
                {isVegetarian ? "Veg" : "Non-veg"}
              </span>
            )}
          </div>

          <div className="d-flex align-items-baseline gap-2 mb-2">
            <span className="fw-bold fs-5 text-dark">
              {hasPrice
                ? `₹${Number(price).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}`
                : "Price unavailable"}
            </span>
            {dish.prepTimeMinutes != null &&
              dish.prepTimeMinutes !== "" &&
              Number.isFinite(Number(dish.prepTimeMinutes)) && (
                <span className="small text-secondary">
                  <i className="bi bi-clock me-1" aria-hidden="true"></i>
                  {dish.prepTimeMinutes} min
                </span>
              )}
          </div>

          {dish.description && (
            <p
              className="small text-secondary mb-2"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }}
            >
              {dish.description}
            </p>
          )}

          {dish.calorieCount != null &&
            dish.calorieCount !== "" &&
            Number.isFinite(Number(dish.calorieCount)) && (
              <small className="text-secondary mb-2">
                {dish.calorieCount} kcal
              </small>
            )}

          <div className="d-flex justify-content-between align-items-end gap-2 mt-auto pt-2 border-top">
            <div className="small text-secondary">
              {hasCustomizations && "Customizable"}
            </div>
            {isStoreClosed ? (
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-3"
                disabled
              >
                Closed
              </button>
            ) : isUnavailable ? (
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-3"
                disabled
              >
                Unavailable
              </button>
            ) : quantity > 0 && !hasCustomizations ? (
              <div
                className="input-group input-group-sm rounded-pill border overflow-hidden"
                style={{ width: 104 }}
                aria-label={`${dish.name} quantity`}
              >
                <button
                  type="button"
                  className="btn btn-light border-0 fw-bold px-2"
                  onClick={() => removeItem(cartItem?.cartKey)}
                  aria-label={`Decrease quantity of ${dish.name}`}
                >
                  −
                </button>
                <span className="form-control text-center bg-white border-0 fw-bold p-0 d-flex align-items-center justify-content-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="btn btn-light border-0 fw-bold px-2 text-danger"
                  onClick={handleAddClick}
                  aria-label={`Increase quantity of ${dish.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-danger rounded-pill px-4 py-2 fw-bold"
                onClick={handleAddClick}
                disabled={!hasPrice}
                aria-label={`ADD ${dish.name}${hasCustomizations ? " and choose options" : " to cart"}`}
              >
                {hasCustomizations ? "OPTIONS" : "ADD"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default DishCard;
