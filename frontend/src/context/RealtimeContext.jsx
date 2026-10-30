import React, { createContext, useContext, useEffect, useState } from "react";
import realtime from "../services/websocket";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [activeJobOffer, setActiveJobOffer] = useState(null);
  const [incomingKitchenOrder, setIncomingKitchenOrder] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // Browser online/offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Web Audio synth tones
  const playAlertSound = (type = "ding") => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.onended = () => ctx.close();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "bell") {
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
      console.warn("Audio playback blocked or unavailable", e);
    }
  };

  useEffect(() => {
    setNotifications([]);
    setActiveJobOffer(null);
    setIncomingKitchenOrder(null);
    if (!user) {
      setIsConnected(false);
      return;
    }

    realtime.connect();

    const offConn = realtime.on("connection_status", (data) => {
      setIsConnected(data?.status === "connected");
    });

    // Fetch initial notifications
    api
      .get("/notifications")
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      })
      .catch(() => {});

    // Listen to rider job offers
    const offJobOffer = realtime.on("rider_job_offer", (offer) => {
      setActiveJobOffer(offer);
      playAlertSound("bell");
    });

    // Listen to kitchen new orders
    const offKitchenOrder = realtime.on("new_order_placed", (order) => {
      setIncomingKitchenOrder(order);
      playAlertSound("bell");
    });

    // Listen to general order status updates
    const offOrderStatus = realtime.on("order_status_updated", (payload) => {
      api
        .get("/notifications")
        .then((res) => {
          if (res.success) setNotifications(res.data || []);
        })
        .catch(() => {});
      playAlertSound("ding");
    });

    return () => {
      offConn();
      offJobOffer();
      offKitchenOrder();
      offOrderStatus();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error(err.message);
    }
  };
  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err.message);
    }
  };
  const clearAllNotifications = async () => {
    try {
      await api.delete("/notifications");
      setNotifications([]);
    } catch (err) {
      console.error(err.message);
    }
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
