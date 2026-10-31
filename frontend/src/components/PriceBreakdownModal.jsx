import React from "react";
import ModalPortal from "./ModalPortal";

const PriceBreakdownModal = ({ show, onClose, billDetails }) => {
  if (!show || !billDetails) return null;

  const {
    priceTransparency,
    itemisedBill,
    subtotal,
    dineInSubtotal,
    packagingFee,
    deliveryFee,
    platformFee,
    gstTax,
    totalAmount,
  } = billDetails;
  const isParity = priceTransparency?.isPurePriceParity;
  const markup = priceTransparency?.dineInMarkup || 0;

  return (
    <ModalPortal isOpen={show}>
      <div
        className="modal show d-block"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(8px)",
          zIndex: 10050,
        }}
        tabIndex="-1"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
            <div className="modal-header border-0 bg-light p-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    background: "#e0f2fe",
                    color: "#0284c7",
                    fontSize: 24,
                  }}
                >
                  <i className="bi bi-shield-check"></i>
                </div>
                <div>
                  <h5 className="modal-title fw-bold mb-1">
                    Radical Price Transparency
                  </h5>
                  <p className="text-muted small mb-0">
                    Direct comparison with restaurant dine-in menu prices
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              {/* Parity Status Banner */}
              <div
                className={`p-3 rounded-3 mb-4 d-flex align-items-center justify-content-between ${isParity ? "bg-success-subtle text-success border border-success" : "bg-warning-subtle text-warning-emphasis border border-warning"}`}
              >
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`bi ${isParity ? "bi-patch-check-fill" : "bi-info-circle-fill"} fs-5`}
                  ></i>
                  <div>
                    <div className="fw-bold">
                      {isParity
                        ? "100% Dine-In Menu Price Parity Verified"
                        : "Menu Markup Detected"}
                    </div>
                    <small className="opacity-75">
                      {isParity
                        ? "Dishes cost exactly the same as walking into the restaurant."
                        : `Platform prices carry a ₹${markup} difference compared to dine-in.`}
                    </small>
                  </div>
                </div>
                <span
                  className={`badge ${isParity ? "bg-success" : "bg-warning text-dark"} px-3 py-2 rounded-pill`}
                >
                  {isParity ? "0% MARKUP" : `₹${markup} DIFFERENCE`}
                </span>
              </div>

              {/* Dish By Dish Comparison */}
              <h6 className="fw-bold mb-3 text-secondary text-uppercase small">
                Dish Price Parity Audit
              </h6>
              <div className="table-responsive mb-4">
                <table className="table table-sm align-middle">
                  <thead className="table-light small">
                    <tr>
                      <th>Item & Variant</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Dine-In Menu</th>
                      <th className="text-end">Platform Price</th>
                      <th className="text-end">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemisedBill?.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="fw-bold">{item.name}</div>
                          {item.variantName && (
                            <small className="text-muted">
                              {item.variantName}
                            </small>
                          )}
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end text-muted">
                          ₹{item.dineInPrice}
                        </td>
                        <td className="text-end fw-bold">₹{item.unitPrice}</td>
                        <td className="text-end">
                          {item.hasPriceParity ? (
                            <span className="badge bg-success-subtle text-success border border-success small">
                              Equal Rate ✓
                            </span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning small">
                              Markup
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Where Every Rupee Goes */}
              <h6 className="fw-bold mb-3 text-secondary text-uppercase small">
                Honest Bill Breakdown: Where Your Money Goes
              </h6>
              <div className="list-group list-group-flush rounded-3 border">
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold">
                      100% to Restaurant Kitchen
                    </div>
                    <small className="text-muted">
                      Direct compensation for fresh ingredients and culinary
                      preparation
                    </small>
                  </div>
                  <span className="fw-bold">₹{subtotal}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold">
                      Tamper-Evident Thermal Packaging
                    </div>
                    <small className="text-muted">
                      Leak-proof, insulated, food-safe containers
                    </small>
                  </div>
                  <span className="fw-bold">₹{packagingFee}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold">
                      Delivery Partner Distance Fare
                    </div>
                    <small className="text-muted">
                      100% paid to rider based on distance and honest wait-time
                      compensation
                    </small>
                  </div>
                  <span className="fw-bold">₹{deliveryFee}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold">
                      Platform Convenience & Live Tracking Fee
                    </div>
                    <small className="text-muted">
                      Subsidizes cloud maps, real-time GPS streaming, and
                      payment security
                    </small>
                  </div>
                  <span className="fw-bold">₹{platformFee}</span>
                </div>
                <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <div>
                    <div className="fw-semibold">
                      Government Restaurant GST (5%)
                    </div>
                    <small className="text-muted">
                      Direct tax remittance (2.5% CGST + 2.5% SGST)
                    </small>
                  </div>
                  <span className="fw-bold">₹{gstTax}</span>
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                <span className="fs-5 fw-bold">Total Transparent Bill:</span>
                <span
                  className="fs-4 fw-extrabold text-primary"
                  style={{ color: "var(--c-primary)" }}
                >
                  ₹{totalAmount}
                </span>
              </div>
            </div>

            <div className="modal-footer border-0 bg-light p-3">
              <button
                type="button"
                className="btn btn-secondary px-4 rounded-3"
                onClick={onClose}
              >
                Close Explainer
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default PriceBreakdownModal;
