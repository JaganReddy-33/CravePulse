import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';
import { findAddressById, getDefaultAddress, isValidBillQuote } from '../utils/address';


export function useCheckout({ cart, billDetails, couponCode, riderTip, clearCart, user, setDeliveryCoordinates }) {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(Boolean(user?.id));
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('COD');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [walletBalance, setWalletBalance] = useState(0);
  const [codMaxLimit, setCodMaxLimit] = useState(2000);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const requestKey = useMemo(() => crypto.randomUUID(), [cart, couponCode, riderTip, selectedAddressId, paymentMode]);

  useEffect(() => {
    api.get('/payments/config')
      .then((res) => {
        if (res.success && res.data) {
          if (res.data.codMaxLimit) setCodMaxLimit(Number(res.data.codMaxLimit));
          if (res.data.razorpayKeyId) setRazorpayKeyId(res.data.razorpayKeyId);
        }
      })
      .catch(() => { });

    let active = true;
    if (!user?.id) {
      setAddresses([]);
      setSelectedAddressId(null);
      setAddressesLoading(false);
      return () => { active = false; };
    }

    setAddresses([]);
    setSelectedAddressId(null);
    setAddressesLoading(true);
    setError('');
    api.get('/auth/addresses')
      .then((res) => {
        if (!active) return;
        if (!res.success || !Array.isArray(res.data)) {
          throw new Error(res.message || 'Unable to load saved delivery addresses.');
        }
        setAddresses(res.data);
        setSelectedAddressId(getDefaultAddress(res.data)?.id ?? null);
      })
      .catch((err) => {
        if (active) setError(err.message || 'Unable to load saved delivery addresses.');
      })
      .finally(() => {
        if (active) setAddressesLoading(false);
      });

    api.get('/wallet')
      .then((res) => {
        if (active && res.success && res.data && res.data.balance !== undefined) {
          setWalletBalance(Number(res.data.balance));
        }
      })
      .catch(() => { });
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    const address = findAddressById(addresses, selectedAddressId);
    if (setDeliveryCoordinates) {
      const latitude = Number(address?.latitude);
      const longitude = Number(address?.longitude);
      setDeliveryCoordinates(
        Number.isFinite(latitude) &&
          Number.isFinite(longitude) &&
          Math.abs(latitude) <= 90 &&
          Math.abs(longitude) <= 180
          ? { latitude, longitude }
          : null,
      );
    }
  }, [addresses, selectedAddressId, setDeliveryCoordinates]);

  const handleSaveAddress = async (newAddr) => {
    try {
      const res = await api.post('/auth/addresses', newAddr);
      if (res.success && res.data?.id != null) {
        setAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
      } else {
        throw new Error(res.message || 'The address could not be saved. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Unable to save address');
      throw err;
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setSubmitting(true);

    try {
      const activeAddress = findAddressById(addresses, selectedAddressId);

      if (addressesLoading) throw new Error('Wait for your saved delivery addresses to finish loading.');
      if (!activeAddress?.id) throw new Error('Select or add a delivery address first.');
      if (paymentMode === 'RAZORPAY' && (!window.Razorpay || !razorpayKeyId)) throw new Error('Online payment is unavailable. Choose another payment method.');
      if (!isValidBillQuote(billDetails) || !cart.items.length) throw new Error('Wait for a valid server price quote.');

      const orderPayload = {
        restaurantId: cart.restaurantId,
        deliveryAddressId: Number(activeAddress.id),
        deliveryAddress: `${activeAddress.addressLine}, ${activeAddress.city || ''}, ${activeAddress.state || ''} ${activeAddress.postalCode || ''}`,
        paymentMode: paymentMode,
        couponCode: couponCode || null,
        tipAmount: riderTip || 0,
        specialInstructions: specialInstructions.trim() || null,
        items: cart.items.map((it) => ({
          menuItemId: it.id,
          quantity: it.quantity,
          variantId: it.selectedVariant?.id || null,
          addonIds: it.selectedAddons?.map(a => a.id) || [],
        })),
      };

      const res = await api.post('/orders', orderPayload, { headers: { 'X-Idempotency-Key': requestKey } });
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to place order');
      }

      const createdOrder = res.data;

      // Handle Online Payment via Razorpay
      if (paymentMode === 'RAZORPAY') {
        if (window.Razorpay) {
          const session = createdOrder.paymentSession ? { success: true, data: createdOrder.paymentSession } : await api.post('/payments/create', { orderId: createdOrder.id });
          if (!session.success || !session.data?.razorpayOrderId) throw new Error('Unable to start payment');
          const options = {
            key: session.data.keyId,
            order_id: session.data.razorpayOrderId,
            amount: session.data.amount,
            currency: 'INR',
            name: 'CravePulse Fair Dining',
            description: `Order #${createdOrder.orderNumber || createdOrder.id}`,
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
            handler: async function (response) {
              try {
                const verification = await api.post('/payments/verify', {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });
                if (!verification.success) throw new Error('Payment confirmation is pending');
              } catch (confirmErr) {
                setError(`Payment confirmation pending for order ${createdOrder.orderNumber || createdOrder.id}. ${confirmErr.message}`);
                return;
              }
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              clearCart();
              navigate(`/orders/${createdOrder.orderNumber || createdOrder.id}?paymentSuccess=true`);
            },
            prefill: {
              name: user?.fullName || 'Customer',
              email: user?.email || '',
              contact: user?.phone || '',
            },
            theme: { color: '#ff5722' },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
          setSubmitting(false);
          return;
        }
      }

      if (paymentMode === 'WALLET' && createdOrder.paymentStatus !== 'PAID') {
        const paid = await api.post('/payments/wallet', { orderId: createdOrder.id });
        if (!paid.success) throw new Error('Wallet payment was not confirmed');
      }
      // COD is placed; wallet has been verified by the server
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      clearCart();
      navigate(`/orders/${createdOrder.orderNumber || createdOrder.id}?orderPlaced=true`);
    } catch (err) {
      setError(err.message || 'Failed to complete order. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    addresses,
    addressesLoading,
    selectedAddressId,
    setSelectedAddressId,
    selectedAddress: findAddressById(addresses, selectedAddressId),
    hasValidQuote: isValidBillQuote(billDetails),
    handleSaveAddress,
    paymentMode,
    setPaymentMode,
    specialInstructions,
    setSpecialInstructions,
    submitting,
    error,
    walletBalance,
    codMaxLimit,
    onlineAvailable: Boolean(razorpayKeyId),
    handlePlaceOrder,
  };
}

export default useCheckout;
