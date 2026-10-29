import React, { createContext, useContext, useEffect, useState } from 'react';
import realtime from '../services/websocket';
import { useAuth } from './AuthContext';
import api from '../services/api';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Welcome to CravePulse!',
    message: 'Enjoy 100% Dine-In Menu Price Parity across top kitchens in your city.',
    createdAt: 'Just now',
    isRead: false,
    type: 'welcome'
  }
];

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('cravepulse_notifications');
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [activeJobOffer, setActiveJobOffer] = useState(null);
  const [incomingKitchenOrder, setIncomingKitchenOrder] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Browser online/offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cravepulse_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  }, [notifications]);

  // Web Audio synth tones
  const playAlertSound = (type = 'ding') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'bell') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.warn('Audio playback blocked or unavailable', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    realtime.connect();

    const offConn = realtime.on('connection_status', (data) => {
      setIsConnected(data?.status === 'connected');
    });

    // Fetch initial notifications
    api.get('/auth/notifications').then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setNotifications(res.data);
      }
    }).catch(() => {});

    // Listen to rider job offers
    const offJobOffer = realtime.on('rider_job_offer', (offer) => {
      setActiveJobOffer(offer);
      playAlertSound('bell');
    });

    // Listen to kitchen new orders
    const offKitchenOrder = realtime.on('new_order_placed', (order) => {
      setIncomingKitchenOrder(order);
      playAlertSound('bell');
    });

    // Listen to general order status updates
    const offOrderStatus = realtime.on('order_status_updated', (payload) => {
      const newNotif = {
        id: Date.now(),
        title: `Order Update: ${payload.orderNumber || ''}`,
        message: `Status is now ${payload.status}`,
        createdAt: 'Just now',
        isRead: false,
        type: 'order'
      };
      setNotifications((prev) => [newNotif, ...prev]);
      playAlertSound('ding');
    });

    return () => {
      offConn();
      offJobOffer();
      offKitchenOrder();
      offOrderStatus();
    };
  }, [user]);

  // Interactive read/unread functions
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    api.post(`/notifications/${id}/read`).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    api.post('/notifications/read-all').catch(() => {});
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('cravepulse_notifications');
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        activeJobOffer,
        setActiveJobOffer,
        incomingKitchenOrder,
        setIncomingKitchenOrder,
        playAlertSound,
        isConnected,
        isOnline,
      }}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div
          className="bg-danger text-white py-1 px-3 text-center small fw-bold sticky-top"
          style={{ zIndex: 1090 }}
          role="alert"
          aria-live="assertive"
        >
          📡 You are currently offline. Check your internet connection.
        </div>
      )}
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => useContext(RealtimeContext);
export default RealtimeContext;
