import React from 'react';

/**
 * CheckoutPaymentMethods: Payment method options including Razorpay, CravePulse Wallet, and Cash on Delivery.
 */
const CheckoutPaymentMethods = ({
  paymentMode,
  setPaymentMode,
  walletBalance,
  codMaxLimit,
  totalAmount,
}) => {
  const isCodDisabled = totalAmount > codMaxLimit;
  const isWalletInsufficient = walletBalance < totalAmount;

  return (
    <div className="card border-0 rounded-4 shadow-sm p-4 bg-white mb-4">
      <h5 className="fw-extrabold text-dark mb-3">
        <i className="bi bi-credit-card-2-front-fill text-danger me-2"></i>
        Payment Method
      </h5>

      <div className="d-flex flex-column gap-3">
        {/* 1. Online Payment: UPI, Cards, Netbanking (Razorpay) */}
        <label
          className={`d-flex align-items-center justify-content-between p-3 rounded-4 border cursor-pointer transition ${
            paymentMode === 'RAZORPAY' ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === 'RAZORPAY'}
              onChange={() => setPaymentMode('RAZORPAY')}
              className="form-check-input mt-0"
            />
            <div>
              <strong className="d-block text-dark small">UPI, Cards, Net Banking & Wallets</strong>
              <small className="text-muted" style={{ fontSize: 11 }}>
                Instant verification via Razorpay Gateway (GPay, PhonePe, Cards)
              </small>
            </div>
          </div>
          <span className="badge bg-primary-subtle text-primary small">Instant & Secure</span>
        </label>

        {/* 2. CravePulse Wallet */}
        <label
          className={`d-flex align-items-center justify-content-between p-3 rounded-4 border cursor-pointer transition ${
            paymentMode === 'WALLET' ? 'border-danger bg-danger-subtle' : 'border-light bg-light'
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === 'WALLET'}
              onChange={() => setPaymentMode('WALLET')}
              disabled={isWalletInsufficient}
              className="form-check-input mt-0"
            />
            <div>
              <strong className="d-block text-dark small">CravePulse Wallet Balance</strong>
              <small className={isWalletInsufficient ? 'text-danger' : 'text-success'} style={{ fontSize: 11 }}>
                Available Balance: ₹{walletBalance.toFixed(2)}
                {isWalletInsufficient ? ' (Insufficient balance)' : ''}
              </small>
            </div>
          </div>
          <span className="badge bg-success-subtle text-success small">1-Click Fast Pay</span>
        </label>

        {/* 3. Cash on Delivery (COD) */}
        <label
          className={`d-flex align-items-center justify-content-between p-3 rounded-4 border transition ${
            isCodDisabled
              ? 'opacity-50 cursor-not-allowed bg-light'
              : paymentMode === 'COD'
              ? 'border-danger bg-danger-subtle cursor-pointer'
              : 'border-light bg-light cursor-pointer'
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <input
              type="radio"
              name="paymentMode"
              checked={paymentMode === 'COD'}
              onChange={() => !isCodDisabled && setPaymentMode('COD')}
              disabled={isCodDisabled}
              className="form-check-input mt-0"
            />
            <div>
              <strong className="d-block text-dark small">Cash on Delivery (COD)</strong>
              <small className="text-muted" style={{ fontSize: 11 }}>
                {isCodDisabled
                  ? `COD disabled for orders above ₹${codMaxLimit}. Please use online payment.`
                  : 'Pay cash or UPI scan directly to the delivery captain at doorstep.'}
              </small>
            </div>
          </div>
          <span className="badge bg-secondary-subtle text-secondary small">Doorstep</span>
        </label>
      </div>
    </div>
  );
};

export default CheckoutPaymentMethods;
