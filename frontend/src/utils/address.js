export function sameAddressId(left, right) {
  return left != null && right != null && String(left) === String(right);
}

export function findAddressById(addresses, id) {
  return addresses.find((address) => sameAddressId(address.id, id)) || null;
}

export function getDefaultAddress(addresses) {
  return addresses.find((address) => address.default ?? address.isDefault) || addresses[0] || null;
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
