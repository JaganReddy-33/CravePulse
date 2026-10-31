const COORDINATE_PAIR = /(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/;
const AT_COORDINATES = /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/;
const DATA_COORDINATES = /!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/;

const isGoogleMapsHost = (hostname) =>
  /^(?:[a-z0-9-]+\.)*google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})$/.test(hostname) ||
  hostname === 'maps.app.goo.gl';

export function isSafeGoogleMapsUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    const isMapsPath = url.hostname === 'maps.google.com' ||
      url.hostname === 'maps.app.goo.gl' ||
      url.pathname.startsWith('/maps');
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      isGoogleMapsHost(url.hostname) &&
      isMapsPath;
  } catch {
    return false;
  }
}

function toCoordinates(match) {
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) return null;
  return { latitude, longitude };
}

export function parseGoogleMapsCoordinates(value) {
  if (!isSafeGoogleMapsUrl(value)) return null;
  const url = new URL(String(value).trim());
  const pathAndSearch = `${url.pathname}${url.search}`;
  const match = pathAndSearch.match(AT_COORDINATES) ||
    pathAndSearch.match(DATA_COORDINATES) ||
    (url.searchParams.get('q') || '').match(COORDINATE_PAIR);
  return toCoordinates(match);
}

export function getGoogleMapsNavigationUrl(mapsUrl, latitude, longitude) {
  if (isSafeGoogleMapsUrl(mapsUrl)) return mapsUrl.trim();
  if (latitude == null || latitude === '' || longitude == null || longitude === '') return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
