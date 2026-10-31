import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CheckoutAddressSection from '../components/checkout/CheckoutAddressSection';

describe('CheckoutAddressSection', () => {
  it('selects a saved default address when its ID is represented as a string', () => {
    const address = { id: 42, default: true, title: 'Home', addressLine: 'Park Road' };
    const otherAddress = { id: 41, title: 'Work', addressLine: 'Office' };
    const onSelectAddress = vi.fn();
    render(
      <CheckoutAddressSection
        addresses={[otherAddress, address]}
        selectedAddressId="41"
        onSelectAddress={onSelectAddress}
        onSaveAddress={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole('radio');
    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);
    expect(screen.getByText('Default')).toBeTruthy();
    fireEvent.click(radios[1]);
    expect(onSelectAddress).toHaveBeenCalledWith(42);
  });

  it('rejects a map link without readable coordinates and sends no fabricated coordinates', async () => {
    const onSaveAddress = vi.fn().mockResolvedValue(undefined);
    render(
      <CheckoutAddressSection
        addresses={[]}
        selectedAddressId={null}
        onSelectAddress={vi.fn()}
        onSaveAddress={onSaveAddress}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add new address/i }));
    fireEvent.change(screen.getByLabelText('Street Address / House No.'), { target: { value: '12 Park Road' } });
    fireEvent.change(screen.getByLabelText('Postal PIN Code'), { target: { value: '560001' } });
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Bengaluru' } });
    fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Karnataka' } });
    fireEvent.change(screen.getByLabelText('Google Maps link'), { target: { value: 'https://maps.app.goo.gl/short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Address' }));

    expect(await screen.findByText(/could not read coordinates/i)).toBeTruthy();
    expect(onSaveAddress).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Google Maps link'), {
      target: { value: 'https://www.google.com/maps/@12.9716,77.5946,17z' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Address' }));
    await waitFor(() => expect(onSaveAddress).toHaveBeenCalledOnce());
    const payload = onSaveAddress.mock.calls[0][0];
    expect(payload.mapsUrl).toContain('/@12.9716,77.5946');
    expect(payload).not.toHaveProperty('latitude');
    expect(payload).not.toHaveProperty('longitude');
  });
});
