import { describe, expect, it } from 'vitest';
import { resolveRealtimeUrl } from '../services/websocket';

describe('resolveRealtimeUrl', () => {
  it('uses the realtime path when the local WebSocket base already ends in /ws', () => {
    const url = resolveRealtimeUrl('ws://localhost:8081/ws', '/api', 'http://localhost:5173');
    expect(url.toString()).toBe('ws://localhost:8081/ws/realtime');
  });

  it('does not duplicate the path when given the complete realtime URL', () => {
    const url = resolveRealtimeUrl('wss://api.example.com/ws/realtime/', '/api', 'https://app.example.com');
    expect(url.toString()).toBe('wss://api.example.com/ws/realtime');
  });

  it('derives the WebSocket endpoint from an absolute production API URL', () => {
    const url = resolveRealtimeUrl('', 'https://api.example.com/api', 'https://app.example.com');
    expect(url.toString()).toBe('wss://api.example.com/ws/realtime');
  });

  it('uses the Vite WebSocket proxy for a local relative API base', () => {
    const url = resolveRealtimeUrl('', '/api', 'http://localhost:5173');
    expect(url.toString()).toBe('ws://localhost:5173/ws/realtime');
  });
});
