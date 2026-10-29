import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';


export function useCheckout({ cart, billDetails, couponCode, riderTip, clearCart, user, setDeliveryCoordinates }) {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
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
      .catch(() => {});

    if (user) {
      api.get('/auth/addresses')
        .then((res) => {
          if (res.success && Array.isArray(res.data) ) {
            setAddresses(res.data);
            const def = res.data.find((a) => a.default) || res.data[0];
            setSelectedAddressId(def?.id ?? null);
          }
        })
        .catch(() => {});

      api.get('/wallet')
        .then((res) => {
          if (res.success && res.data && res.data.balance !== undefined) {
            setWalletBalance(Number(res.data.balance));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const address = addresses.find(a => a.id === selectedAddressId);
    if (setDeliveryCoordinates) setDeliveryCoordinates(address?.latitude != null && address?.longitude != null ? { latitude: address.latitude, longitude: address.longitude } : null);
  }, [addresses, selectedAddressId, setDeliveryCoordinates]);

  const handleSaveAddress = async (newAddr) => {
    try {
      const res = await api.post('/auth/addresses', newAddr);
      if (res.success && res.data) {
        setAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
      } else {
        throw new Error('The address could not be saved. Please try again.');
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
      const activeAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

      if (!activeAddress?.id) throw new Error('Add and save a delivery address first.');
      if (!billDetails || !cart.items.length) throw new Error('Wait for a valid server price quote.');
      if (paymentMode === 'RAZORPAY' && (!window.Razorpay || !razorpayKeyId)) throw new Error('Online payment is unavailable. Choose another payment method.');

      const orderPayload = {
        restaurantId: cart.restaurantId,
        deliveryAddressId: activeAddress.id,
        deliveryAddress: `${activeAddress.addressLine}, ${activeAddress.city || ''} ${activeAddress.postalCode || ''}`,
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
    selectedAddressId,
    setSelectedAddressId,
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
