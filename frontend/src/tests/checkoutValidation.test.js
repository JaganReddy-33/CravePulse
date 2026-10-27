import { describe, it, expect } from 'vitest';

export function validateCheckoutForm({ selectedAddress, paymentMethod, totalAmount, codLimit = 2000 }) {
  const errors = {};

  if (!selectedAddress) {
    errors.address = 'Please select or add a delivery address';
  }

  if (!paymentMethod) {
    errors.payment = 'Please select a payment method';
  }

  if (paymentMethod === 'COD' && totalAmount > codLimit) {
    errors.payment = `Cash on Delivery is limited to orders up to Rs. ${codLimit}. Please use Razorpay or Wallet.`;
  }

  if (totalAmount <= 0) {
    errors.amount = 'Order total must be greater than zero';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function computeBillDetails({ subtotal, couponDiscount = 0, packagingFee = 15, deliveryFee = 35, platformFee = 5, gstRate = 0.05, tipAmount = 0 }) {
  const taxable = Math.max(0, subtotal - couponDiscount + packagingFee);
  const gstTax = Math.round(taxable * gstRate * 100) / 100;
  const totalAmount = Math.round((taxable + deliveryFee + platformFee + gstTax + tipAmount) * 100) / 100;

  return {
    taxable,
    gstTax,
    totalAmount,
    tipAmount,
  };
}

describe('Checkout Validation & Bill Details Tests', () => {
  it('validates required delivery address', () => {
    const res = validateCheckoutForm({
      selectedAddress: null,
      paymentMethod: 'RAZORPAY',
      totalAmount: 450,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.address).toBeDefined();
  });

  it('rejects COD when total amount exceeds the platform COD limit', () => {
    const res = validateCheckoutForm({
      selectedAddress: { id: 1, addressLine: '12th Main Road' },
      paymentMethod: 'COD',
      totalAmount: 2500, // exceeds ₹2000
      codLimit: 2000,
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.payment).toContain('Cash on Delivery is limited');
  });

  it('passes validation when address is chosen, payment method is valid, and total > 0', () => {
    const res = validateCheckoutForm({
      selectedAddress: { id: 1, addressLine: '12th Main Road' },
      paymentMethod: 'RAZORPAY',
      totalAmount: 450,
    });
    expect(res.isValid).toBe(true);
    expect(res.errors).toEqual({});
  });

  it('computes exact bill breakdown with GST and 100% tip pass-through', () => {
    const bill = computeBillDetails({
      subtotal: 500,
      couponDiscount: 50,
      packagingFee: 15,
      deliveryFee: 35,
      platformFee: 5,
      gstRate: 0.05,
      tipAmount: 30, // 100% passed through
    });

    // Taxable = 500 - 50 + 15 = 465
    // GST (5%) = 23.25
    // Total = 465 + 35 + 5 + 23.25 + 30 = 558.25
    expect(bill.taxable).toBe(465);
    expect(bill.gstTax).toBe(23.25);
    expect(bill.tipAmount).toBe(30);
    expect(bill.totalAmount).toBe(558.25);
  });
});
