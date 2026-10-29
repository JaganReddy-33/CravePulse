import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import DishCard from '../components/restaurant/DishCard';
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
function CartProbe() {
  const { cart, totalItemCount } = useCart();
  return <output data-testid="cart">{JSON.stringify({ ...cart, totalItemCount })}</output>;
}
describe('Menu to cart integration', () => {
  it('adds a database menu item with its restaurant and decrements it through the real card controls', () => {
    const dish = { id: 37, restaurantId: 9, name: 'Menu dish', platformPrice: 125, dineInPrice: 125, isAvailable: true };
    render(<CartProvider><DishCard dish={dish} restaurantName="Kitchen" /><CartProbe /></CartProvider>);
    fireEvent.click(screen.getByRole('button', { name: /^ADD/ }));
    let cart = JSON.parse(screen.getByTestId('cart').textContent);
    expect(cart.restaurantId).toBe(9); expect(cart.restaurantName).toBe('Kitchen'); expect(cart.items[0].id).toBe(37); expect(cart.totalItemCount).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Menu dish' }));
    expect(JSON.parse(screen.getByTestId('cart').textContent).totalItemCount).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity of Menu dish' }));
    expect(JSON.parse(screen.getByTestId('cart').textContent).totalItemCount).toBe(1);
  });
});
