import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';

const DEFAULT_ADDRESSES = [
  { id: 1, title: 'Home', addressLine: 'Apartment 402, Sunshine Heights, 12th Main Road', landmark: 'Near 100ft Road junction, Indiranagar', city: 'Bangalore', state: 'Karnataka', postalCode: '560038', default: true },
  { id: 2, title: 'Work', addressLine: 'WeWork Galaxy, 43 Residency Road, Shanthala Nagar', landmark: 'Opposite Bangalore Club', city: 'Bangalore', state: 'Karnataka', postalCode: '560025', default: false },
  { id: 3, title: 'Other', addressLine: 'Villa 18, Green Meadows, 5th Cross, HSR Sector 1', landmark: 'Near Agara Lake Park', city: 'Bangalore', state: 'Karnataka', postalCode: '560102', default: false },
];

export function useCheckout({ cart, billDetails, couponCode, riderTip, clearCart, user }) {
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState(DEFAULT_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState(1);
  const [paymentMode, setPaymentMode] = useState('RAZORPAY');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [walletBalance, setWalletBalance] = useState(0);
  const [codMaxLimit, setCodMaxLimit] = useState(2000);
  const [razorpayKeyId, setRazorpayKeyId] = useState('rzp_test_cravepulse_demo2026');

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
          if (res.success && Array.isArray(res.data) && res.data.length > 0) {
            setAddresses(res.data);
            const def = res.data.find((a) => a.default) || res.data[0];
            setSelectedAddressId(def.id);
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

  const handleSaveAddress = async (newAddr) => {
    try {
      const res = await api.post('/auth/addresses', newAddr);
      if (res.success && res.data) {
        setAddresses((prev) => [...prev, res.data]);
        setSelectedAddressId(res.data.id);
      } else {
        const fallbackId = Date.now();
        const created = { id: fallbackId, ...newAddr };
        setAddresses((prev) => [...prev, created]);
        setSelectedAddressId(fallbackId);
      }
    } catch {
      const fallbackId = Date.now();
      const created = { id: fallbackId, ...newAddr };
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(fallbackId);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    setSubmitting(true);

    try {
      const activeAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

      const orderPayload = {
        restaurantId: cart.restaurantId,
        deliveryAddressId: activeAddress.id,
        deliveryAddress: `${activeAddress.addressLine}, ${activeAddress.city || 'Bangalore'} ${activeAddress.postalCode || ''}`,
        paymentMethod: paymentMode,
        couponCode: couponCode || null,
        tipAmount: riderTip || 0,
        specialInstructions: specialInstructions.trim() || null,
        items: cart.items.map((it) => ({
          menuItemId: it.id,
          quantity: it.quantity,
          selectedVariant: it.selectedVariant || null,
          selectedAddons: it.selectedAddons || [],
        })),
      };

      const res = await api.post('/orders', orderPayload);
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to place order');
      }

      const createdOrder = res.data;

      // Handle Online Payment via Razorpay
      if (paymentMode === 'RAZORPAY') {
        if (window.Razorpay) {
          const options = {
            key: razorpayKeyId,
            amount: Math.round(Number(createdOrder.totalAmount) * 100),
            currency: 'INR',
            name: 'CravePulse Fair Dining',
            description: `Order #${createdOrder.orderNumber || createdOrder.id}`,
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100',
            handler: async function (response) {
              try {
                await api.post(`/payments/orders/${createdOrder.id}/confirm`, {
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });
              } catch (confirmErr) {
                console.warn('Payment confirmation warning:', confirmErr);
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

      // COD or Wallet direct success
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
    handlePlaceOrder,
  };
}

export default useCheckout;
