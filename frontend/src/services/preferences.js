import api from './api';
import { getAccessToken } from './session';
let preferences = {};
let queue = Promise.resolve();
export const getPreference = (key) => preferences[key];
export const setPreference = (key, value) => {
  preferences = { ...preferences, [key]: value };
  window.dispatchEvent(new Event('preferences-changed'));
  if (getAccessToken()) {
    const snapshot = { ...preferences };
    queue = queue.catch(() => {}).then(() => api.put('/account/preferences', snapshot)).catch(err => console.error('Preference save failed:', err.message));
  }
};
export const loadPreferences = async () => {
  const res = await api.get('/account/preferences');
  preferences = res.data || {};
  window.dispatchEvent(new Event('preferences-changed'));
};
export const clearPreferences = () => { preferences = {}; window.dispatchEvent(new Event('preferences-changed')); };
