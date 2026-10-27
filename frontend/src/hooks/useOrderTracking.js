import { useState, useEffect } from 'react';
import api from '../services/api';
import realtime from '../services/websocket';

export function useOrderTracking(orderNumber) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderCoords, setRiderCoords] = useState([12.9740, 77.6370]);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    let isCancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/number/${orderNumber}`);
        if (!isCancelled && res.success && res.data) {
          setOrder(res.data);
          if (res.data.riderLat && res.data.riderLng) {
            setRiderCoords([res.data.riderLat, res.data.riderLng]);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('API error fetching order tracking:', err);
          setError(err.message || 'Failed to load order');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (orderNumber) {
      fetchOrder();
    }

    // Connect WebSocket channel for real-time order status and GPS updates
    const unsubscribe = realtime.subscribe(`order:${orderNumber}`, (data) => {
      if (!isCancelled && data) {
        if (data.status) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
        }
        if (data.riderLat && data.riderLng) {
          setRiderCoords([data.riderLat, data.riderLng]);
        }
        if (data.type === 'chat_message') {
          setChatMessages((prev) => [
            ...prev,
            { text: data.message, sender: data.senderRole, time: 'Just now' },
          ]);
        }
      }
    });

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [orderNumber]);

  const cancelOrder = async (reason) => {
    if (!order) return;
    try {
      await api.post(`/orders/${order.id}/status`, {
        status: 'CANCELLED',
        reason,
      });
    } catch (e) {
      // optimistic
    }
    setOrder((prev) => ({
      ...prev,
      status: 'CANCELLED',
      cancellationReason: reason,
    }));
  };

  const sendChatMessage = (text, target) => {
    setChatMessages((prev) => [...prev, { text, sender: 'ME', time: 'Just now' }]);
    realtime.send(`order:${orderNumber}`, {
      type: 'chat_message',
      target,
      message: text,
    });
  };

  const submitReview = async (reviewData) => {
    if (!order) return;
    try {
      await api.post(`/orders/${order.id}/review`, reviewData);
    } catch (e) {
      // optimistic
    }
  };

  return {
    order,
    loading,
    error,
    riderCoords,
    chatMessages,
    cancelOrder,
    sendChatMessage,
    submitReview,
  };
}

export default useOrderTracking;
