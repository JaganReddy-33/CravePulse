import { describe, expect, it } from 'vitest';
import {
  getGoogleMapsNavigationUrl,
  isSafeGoogleMapsUrl,
  parseGoogleMapsCoordinates,
} from '../utils/googleMaps';
import {
  findAddressById,
  getDefaultAddress,
  isValidBillQuote,
} from '../utils/address';

describe('Google Maps address URLs', () => {
  it('reads coordinates from /@latitude,longitude links', () => {
    expect(parseGoogleMapsCoordinates('https://www.google.com/maps/@12.9716,77.5946,17z'))
      .toEqual({ latitude: 12.9716, longitude: 77.5946 });
  });

  it('reads coordinates from !3d and !4d markers', () => {
    expect(parseGoogleMapsCoordinates('https://www.google.com/maps/place/Pin/data=!3d-33.8688!4d151.2093'))
      .toEqual({ latitude: -33.8688, longitude: 151.2093 });
  });

  it('reads coordinates from ?q=latitude,longitude', () => {
    expect(parseGoogleMapsCoordinates('https://maps.google.com/?q=12.9716%2C77.5946'))
      .toEqual({ latitude: 12.9716, longitude: 77.5946 });
  });

  it('rejects unsafe, non-HTTPS, coordinate-free and out-of-range links', () => {
    expect(isSafeGoogleMapsUrl('https://google.com.evil.example/maps/@12,77')).toBe(false);
    expect(parseGoogleMapsCoordinates('http://www.google.com/maps/@12,77')).toBeNull();
    expect(parseGoogleMapsCoordinates('https://maps.app.goo.gl/short')).toBeNull();
    expect(parseGoogleMapsCoordinates('https://www.google.com/maps/@91,77')).toBeNull();
  });

  it('uses a saved safe map URL for rider navigation and coordinates as fallback', () => {
    const savedUrl = 'https://www.google.com/maps/@12.9716,77.5946,17z';
    expect(getGoogleMapsNavigationUrl(savedUrl, 0, 0)).toBe(savedUrl);
    expect(getGoogleMapsNavigationUrl(null, 12.9716, 77.5946))
      .toBe('https://www.google.com/maps/dir/?api=1&destination=12.9716,77.5946');
    expect(getGoogleMapsNavigationUrl(null, null, null)).toBeNull();
  });
});

describe('Saved address selection and checkout quote readiness', () => {
  const savedAddress = { id: 21, default: true, latitude: 12.9, longitude: 77.6 };

  it('matches address IDs across numeric and string JSON representations', () => {
    expect(findAddressById([savedAddress], '21')).toBe(savedAddress);
    expect(findAddressById([savedAddress], '22')).toBeNull();
  });

  it('selects default addresses with both current and legacy API field names', () => {
    expect(getDefaultAddress([{ id: 1 }, { id: 2, default: true }]).id).toBe(2);
    expect(getDefaultAddress([{ id: 3, isDefault: true }]).id).toBe(3);
    expect(getDefaultAddress([{ id: 4 }]).id).toBe(4);
  });

  it('only treats complete, positive server quotes as checkout-ready', () => {
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
    expect(isValidBillQuote(quote)).toBe(true);
    expect(isValidBillQuote(null)).toBe(false);
    expect(isValidBillQuote({ ...quote, totalAmount: null })).toBe(false);
    expect(isValidBillQuote({ ...quote, deliveryFee: 'invalid' })).toBe(false);
  });
});
