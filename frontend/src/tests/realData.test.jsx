import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../services/api';
import useCheckout from '../hooks/useCheckout';
vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
const props = () => ({ cart: { restaurantId: 7, items: [{ id: 1, quantity: 1 }] }, billDetails: { totalAmount: 100 }, couponCode: '', riderTip: 0, clearCart: vi.fn(), user: { id: 10 } });
describe('Checkout real-data boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); api.get.mockImplementation(url => Promise.resolve({ success: true, data: url === '/auth/addresses' ? [] : {} })); });
  it('keeps a new customer address list empty and refuses to place an order', async () => {
    const p = props(); const { result } = renderHook(() => useCheckout(p), { wrapper });
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/auth/addresses'));
    expect(result.current.addresses).toEqual([]);
    await act(async () => { await result.current.handlePlaceOrder(); });
    expect(result.current.error).toMatch(/address/i);
    expect(api.post).not.toHaveBeenCalled(); expect(p.clearCart).not.toHaveBeenCalled();
  });
  it('does not manufacture an address ID when saving fails', async () => {
    api.post.mockRejectedValue(new Error('Database unavailable'));
    const p = props(); const { result } = renderHook(() => useCheckout(p), { wrapper });
    await act(async () => { await expect(result.current.handleSaveAddress({ addressLine: 'Real address' })).rejects.toThrow('Database unavailable'); });
    expect(result.current.addresses).toEqual([]); expect(result.current.error).toMatch(/unavailable/);
  });
  it('blocks online checkout when its payment SDK is unavailable', async () => {
    api.get.mockImplementation(url => Promise.resolve({ success: true, data: url === '/auth/addresses' ? [{ id: 99, addressLine: 'Saved address' }] : { razorpayKeyId: 'rzp_test_real' } }));
    const p = props(); const { result } = renderHook(() => useCheckout(p), { wrapper });
    await waitFor(() => expect(result.current.addresses).toHaveLength(1));
    await act(async () => { result.current.setPaymentMode('RAZORPAY'); });
    await act(async () => { await result.current.handlePlaceOrder(); });
    expect(result.current.error).toMatch(/payment is unavailable/i); expect(api.post).not.toHaveBeenCalled(); expect(p.clearCart).not.toHaveBeenCalled();
  });
});
