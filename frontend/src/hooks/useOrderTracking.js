import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import realtime from '../services/websocket';
import { useAuth } from '../context/AuthContext';
export function useOrderTracking(orderNumber) {
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riderCoords, setRiderCoords] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const load = useCallback(async () => {
    const res = await api.get(`/orders/number/${encodeURIComponent(orderNumber)}`);
    if (!res.success || !res.data) throw new Error('Order could not be loaded');
    setOrder(res.data);
    const coords = [res.data.riderLat, res.data.riderLng];
    if (coords.every(v => v != null && Number.isFinite(Number(v)))) setRiderCoords(coords.map(Number));
    return res.data;
  }, [orderNumber]);
  const loadChat = useCallback(async id => {
    const res = await api.get(`/orders/${id}/messages`);
    if (!res.success) throw new Error('Unable to load messages');
    setChatMessages((res.data || []).map(m => ({ id: m.id, text: m.messageText, sender: m.senderUserId === user?.id ? 'ME' : m.senderRole, time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-IN') : '' })));
  }, [user?.id]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setOrder(null); setRiderCoords(null); setChatMessages([]);
    let channel;
    const refresh = async () => {
      try {
        const current = await load();
        if (!active) return;
        const nextChannel = `order:${current.id}`;
        if (channel !== nextChannel) { if (channel) realtime.unsubscribe(channel); channel = nextChannel; realtime.subscribe(channel); }
        await loadChat(current.id);
      } catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    };
    const offStatus = realtime.on('order_status_updated', data => { if (!data?.orderId || channel === `order:${data.orderId}`) refresh(); });
    const offChat = realtime.on('new_chat_message', data => { if (channel === `order:${data.orderId}`) loadChat(data.orderId).catch(err => setError(err.message)); });
    const offLocation = realtime.on('rider_location_updated', data => {
      if (data?.orderId && channel !== `order:${data.orderId}`) return;
      const coords = [data.latitude ?? data.lat, data.longitude ?? data.lng];
      if (coords.every(v => v != null && Number.isFinite(Number(v)))) setRiderCoords(coords.map(Number));
    });
    refresh();
    const poll = setInterval(refresh, 15000);
    return () => { active = false; clearInterval(poll); offStatus(); offChat(); offLocation(); if (channel) realtime.unsubscribe(channel); };
  }, [load, loadChat]);
  const cancelOrder = async reason => {
    try { const res = await api.post(`/orders/${order.id}/status`, { status: 'CANCELLED', reason }); if (!res.success) throw new Error('Cancellation failed'); await load(); return true; }
    catch (err) { setError(err.message); return false; }
  };
  const sendChatMessage = async (text, target) => {
    const res = await api.post(`/orders/${order.id}/messages`, { messageText: text, recipientRole: target });
    if (!res.success) throw new Error('Message was not sent');
    await loadChat(order.id);
  };
  const submitReview = async payload => {
    const res = await api.post('/reviews', { ...payload, orderId: order.id });
    if (!res.success) throw new Error('Review was not saved');
  };
  return { order, loading, error, riderCoords, chatMessages, cancelOrder, sendChatMessage, submitReview };
}
export default useOrderTracking;
