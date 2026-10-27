class RealtimeClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 16000;
    this.heartbeatTimer = null;
    this.subscribedChannels = new Set();
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/ws/realtime${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        // Re-subscribe channels on reconnect
        this.subscribedChannels.forEach((channel) => {
          this.send({ action: 'subscribe', channel });
        });
        this.emit('connection_status', { status: 'connected' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.event) {
            this.emit(message.event, message.data || message);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.emit('connection_status', { status: 'disconnected' });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error', err);
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
    setTimeout(() => this.connect(), delay);
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ action: 'ping' });
    }, 25000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  subscribe(channel) {
    this.subscribedChannels.add(channel);
    this.send({ action: 'subscribe', channel });
  }

  unsubscribe(channel) {
    this.subscribedChannels.delete(channel);
    this.send({ action: 'unsubscribe', channel });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, payload) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error('Listener callback error', e);
        }
      });
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const realtime = new RealtimeClient();
export default realtime;
