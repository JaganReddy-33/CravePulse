import api from '../services/api';
export const PAN_INDIA_CITIES = [];
export const DEFAULT_CITY = { id: 'unselected', name: 'Choose city', hubs: [] };
export const DEFAULT_HUB = { id: 'unselected', name: 'Choose delivery location', area: '', coords: null };
export async function loadLocations() {
  const res = await api.get('/catalog/locations');
  if (!res.success) throw new Error('Unable to load delivery locations');
  PAN_INDIA_CITIES.splice(0, PAN_INDIA_CITIES.length, ...(res.data || []));
  return PAN_INDIA_CITIES;
}
