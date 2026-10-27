import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import api from '../services/api';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { restaurantId, restaurantName, item, variant, addons = [] } = action.payload;

      // Single-restaurant cart validation
      if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
        if (!window.confirm(`Your cart already contains dishes from "${state.restaurantName}". Would you like to clear your cart and start a new order from "${restaurantName}"?`)) {
          return state;
        }
        const cartKey = `${item.id}-${variant?.id || 'base'}-${addons.map(a => a.id).sort().join(',')}`;
        return {
          restaurantId,
          restaurantName,
          items: [{ 
            ...item, 
            selectedVariant: variant, 
            selectedAddons: addons, 
            quantity: 1, 
            cartKey 
          }],
        };
      }

      const cartKey = `${item.id}-${variant?.id || 'base'}-${addons.map(a => a.id).sort().join(',')}`;
      const existingIdx = state.items.findIndex(i => i.cartKey === cartKey);

      let newItems = [];
      if (existingIdx >= 0) {
        newItems = state.items.map((it, idx) =>
          idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it
        );
      } else {
        newItems = [...state.items, { ...item, selectedVariant: variant, selectedAddons: addons, quantity: 1, cartKey }];
      }

      return {
        restaurantId,
        restaurantName: restaurantName || state.restaurantName,
        items: newItems,
      };
    }

    case 'REMOVE_ITEM': {
      const { cartKey } = action.payload;
      const existing = state.items.find(i => i.cartKey === cartKey);
      if (!existing) return state;

      let newItems = [];
      if (existing.quantity > 1) {
        newItems = state.items.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity - 1 } : i);
      } else {
        newItems = state.items.filter(i => i.cartKey !== cartKey);
      }

      return {
        ...state,
        restaurantId: newItems.length === 0 ? null : state.restaurantId,
        restaurantName: newItems.length === 0 ? null : state.restaurantName,
        items: newItems,
      };
    }

    case 'CLEAR_CART':
      return { restaurantId: null, restaurantName: null, items: [] };

    case 'SET_CART':
      return {
        restaurantId: action.payload.restaurantId || null,
        restaurantName: action.payload.restaurantName || null,
        items: action.payload.items || [],
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { restaurantId: null, restaurantName: null, items: [] }, () => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : { restaurantId: null, restaurantName: null, items: [] };
    } catch (e) {
      return { restaurantId: null, restaurantName: null, items: [] };
    }
  });

  const [couponCode, setCouponCode] = useState('');
  const [billDetails, setBillDetails] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Local fallback calculation engine
  const calculateLocalBill = (items, coupon) => {
    let subtotal = 0;
    let dineInSubtotal = 0;

    items.forEach(it => {
      let unitPrice = Number(it.platformPrice || 0);
      let dineIn = Number(it.dineInPrice || it.platformPrice || 0);

      if (it.selectedVariant?.priceAdjustment) {
        unitPrice += Number(it.selectedVariant.priceAdjustment);
        dineIn += Number(it.selectedVariant.priceAdjustment);
      }

      let addonsSum = 0;
      if (it.selectedAddons && it.selectedAddons.length > 0) {
        addonsSum = it.selectedAddons.reduce((acc, a) => acc + Number(a.price || 0), 0);
      }

      subtotal += (unitPrice + addonsSum) * it.quantity;
      dineInSubtotal += (dineIn + addonsSum) * it.quantity;
    });

    subtotal = Math.round(subtotal * 100) / 100;
    dineInSubtotal = Math.round(dineInSubtotal * 100) / 100;

    let discount = 0;
    const cUpper = (coupon || '').trim().toUpperCase();

    if (cUpper === 'FOOD50') {
      if (subtotal >= 199) {
        discount = Math.min(150, Math.round(subtotal * 0.5 * 100) / 100);
      }
    } else if (cUpper === 'WELCOME100') {
      if (subtotal >= 399) {
        discount = 100;
      }
    } else if (cUpper === 'FREESHIP') {
      if (subtotal >= 249) {
        discount = 35;
      }
    }

    const packagingFee = 15.00;
    const deliveryFee = 35.00;
    const platformFee = 5.00;
    const taxable = Math.max(0, subtotal - discount + packagingFee);
    const gstTax = Math.round(taxable * 0.05 * 100) / 100;
    const totalAmount = Math.round((taxable + deliveryFee + platformFee + gstTax) * 100) / 100;

    return {
      subtotal,
      dineInSubtotal,
      restaurantDiscount: 0,
      couponId: discount > 0 ? 1 : null,
      couponCode: discount > 0 ? cUpper : null,
      couponDiscount: discount,
      packagingFee,
      deliveryFee,
      platformFee,
      gstTax,
      totalAmount,
      distanceKm: 2.4,
      etaMinMinutes: 25,
      etaMaxMinutes: 35,
      priceTransparency: {
        dineInSubtotal,
        platformSubtotal: subtotal,
        dineInMarkup: Math.max(0, subtotal - dineInSubtotal),
        isPurePriceParity: subtotal <= dineInSubtotal,
      }
    };
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));

    const recalculateBill = async () => {
      if (!state.restaurantId || state.items.length === 0) {
        setBillDetails(null);
        setCouponError('');
        return;
      }

      // Compute immediate local bill
      const localBill = calculateLocalBill(state.items, couponCode);
      setBillDetails(localBill);

      setCalculating(true);
      try {
        const payload = {
          restaurantId: state.restaurantId,
          items: state.items.map(it => ({
            menuItemId: it.id,
            quantity: it.quantity,
            variantId: it.selectedVariant?.id || null,
            addonIds: it.selectedAddons?.map(a => a.id) || [],
          })),
          couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        };

        const res = await api.post('/cart/calculate', payload);
        if (res.success && res.data) {
          setBillDetails(res.data);
          setCouponError('');
        }
      } catch (e) {
        // If coupon was rejected by server, provide clear user feedback
        if (couponCode && e.message && e.message.toLowerCase().includes('coupon')) {
          setCouponError(e.message);
        }
      } finally {
        setCalculating(false);
      }
    };

    recalculateBill();
  }, [state, couponCode]);

  const applyCoupon = (code) => {
    setCouponError('');
    setCouponCode(code);
  };

  const addItem = (payload) => dispatch({ type: 'ADD_ITEM', payload });
  const removeItem = (cartKey) => dispatch({ type: 'REMOVE_ITEM', payload: { cartKey } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const setCart = (payload) => dispatch({ type: 'SET_CART', payload });

  const totalItemCount = state.items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart: state,
      billDetails,
      calculating,
      couponCode,
      couponError,
      setCouponCode: applyCoupon,
      addItem,
      removeItem,
      clearCart,
      setCart,
      totalItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
export default CartContext;
