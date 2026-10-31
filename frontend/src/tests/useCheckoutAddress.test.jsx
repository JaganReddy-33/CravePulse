import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../services/api';
import useCheckout from '../hooks/useCheckout';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('useCheckout saved-address flow', () => {
  const address = {
    id: 71,
    default: true,
    addressLine: '12 Park Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    latitude: 12.9716,
    longitude: 77.5946,
  };
  const cart = {
    restaurantId: 3,
    items: [{ id: 9, quantity: 1 }],
  };
  const quote = {
    subtotal: 100,
    couponDiscount: 0,
    packagingFee: 15,
    deliveryFee: 35,
    platformFee: 5,
    gstTax: 5.75,
    tipAmount: 0,
    totalAmount: 160.75,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/auth/addresses') return Promise.resolve({ success: true, data: [address] });
      if (path === '/wallet') return Promise.resolve({ success: true, data: { balance: 0 } });
      return Promise.resolve({ success: true, data: {} });
    });
  });

  it('selects the saved default by ID, supplies its coordinates, and requires a valid quote to place an order', async () => {
    const setDeliveryCoordinates = vi.fn();
    const setDeliveryAddressId = vi.fn();
    const setCheckoutQuoteEnabled = vi.fn();
    const clearCart = vi.fn();
    api.post.mockResolvedValue({
      success: true,
      data: { id: 99, orderNumber: 'CP-99', paymentStatus: 'PENDING' },
    });

    const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result, rerender, unmount } = renderHook(
      ({ billDetails, billQuoteAddressId }) => useCheckout({
        cart,
        billDetails,
        billQuoteAddressId,
        billQuoteFresh: billQuoteAddressId != null,
        couponCode: '',
        riderTip: 0,
        clearCart,
        user: { id: 11 },
        setDeliveryCoordinates,
        setDeliveryAddressId,
        setCheckoutQuoteEnabled,
      }),
      {
        initialProps: { billDetails: null, billQuoteAddressId: null },
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.selectedAddressId).toBe(71));
    expect(setCheckoutQuoteEnabled).toHaveBeenCalledWith(true);
    expect(setDeliveryAddressId).toHaveBeenLastCalledWith(71);
    expect(setDeliveryCoordinates).toHaveBeenLastCalledWith({ latitude: 12.9716, longitude: 77.5946 });
    expect(result.current.hasValidQuote).toBe(false);

    await act(async () => result.current.handlePlaceOrder());
    expect(api.post).not.toHaveBeenCalled();
    expect(result.current.error).toContain('valid server price quote');

    rerender({ billDetails: quote, billQuoteAddressId: 70 });
    expect(result.current.hasValidQuote).toBe(false);
    await act(async () => result.current.handlePlaceOrder());
    expect(api.post).not.toHaveBeenCalledWith(
      "/orders",
      expect.anything(),
      expect.anything(),
    );

    rerender({ billDetails: quote, billQuoteAddressId: 71 });
    expect(result.current.hasValidQuote).toBe(true);
    await act(async () => result.current.handlePlaceOrder());
    expect(api.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
      deliveryAddressId: 71,
      deliveryAddress: '12 Park Road, Bengaluru, Karnataka 560001',
    }), expect.any(Object));
    expect(clearCart).toHaveBeenCalledOnce();
    unmount();
    expect(setCheckoutQuoteEnabled).toHaveBeenLastCalledWith(false);
  });
});
