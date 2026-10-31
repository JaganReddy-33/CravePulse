import { isSafeGoogleMapsUrl } from "./googleMaps";

export function sameAddressId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

export function findAddressById(addresses, id) {
  return addresses.find((address) => sameAddressId(address.id, id)) || null;
}

export function getDefaultAddress(addresses) {
  return addresses.find((address) => address.default ?? address.isDefault) || addresses[0] || null;
}

export function getFullAddressParts(address) {
  if (!address) return [];
  const locality = [address.city, address.state, address.postalCode]
    .filter((part) => part != null && String(part).trim())
    .join(", ");
  return [
    address.addressLine,
    address.landmark ? `Landmark: ${address.landmark}` : null,
    locality || null,
  ]
    .filter((part) => part != null && String(part).trim())
    .map((part) => String(part).trim());
}

export function getAddressMapUrl(address) {
  if (isSafeGoogleMapsUrl(address?.mapsUrl)) return address.mapsUrl.trim();
  const query = getFullAddressParts(address).join(", ");
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

export function isValidBillQuote(quote) {
  if (!quote || typeof quote !== 'object') return false;
  const amounts = [
    'subtotal',
    'couponDiscount',
    'packagingFee',
    'deliveryFee',
    'platformFee',
    'gstTax',
    'tipAmount',
    'totalAmount',
  ];
  return amounts.every((field) => {
    if (quote[field] == null || String(quote[field]).trim() === '') return false;
    const value = Number(quote[field]);
    return Number.isFinite(value) && value >= 0;
  }) && Number(quote.totalAmount) > 0;
}
