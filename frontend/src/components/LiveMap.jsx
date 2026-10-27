import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

/**
 * LiveMap component supporting both Daylight Mode (OpenStreetMap) and 
 * High-Contrast Stealth Night Mode (CartoDB Dark Matter) for Rider Cockpit.
 */
const LiveMap = ({
  restaurantCoords = [12.9715987, 77.6350000],
  deliveryCoords = [12.9783692, 77.6408356],
  riderCoords = [12.9740000, 77.6370000],
  riderName = 'Captain Prasad Rao',
  height = '380px',
  darkMode = false,
  interactive = true,
  vehicleIcon = 'bi-bicycle',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map with custom options
    const map = L.map(mapContainerRef.current, {
      center: riderCoords || restaurantCoords,
      zoom: 15,
      zoomControl: false,
      scrollWheelZoom: interactive,
      dragging: interactive,
      touchZoom: interactive,
    });
    mapInstanceRef.current = map;

    if (interactive) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    // Tile Layer: High-Contrast Filtered OSM for Dark Cockpit vs Daylight OSM
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      className: darkMode ? 'leaflet-dark-mode-tiles' : '',
    }).addTo(map);

    // High-Contrast Marker Creator with Glowing Aura
    const createGlowingIcon = (emoji, color, glowColor, label) =>
      L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${glowColor}; opacity: 0.35; animation: pulseGlow 2s infinite;"></div>
            <div style="position: relative; background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 0 16px ${glowColor}; border: 2.5px solid #ffffff; z-index: 2;">
              ${emoji}
            </div>
            ${label ? `<div style="position: absolute; bottom: -20px; white-space: nowrap; font-size: 10px; font-weight: 800; color: #ffffff; background: rgba(15,23,42,0.9); padding: 1px 6px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">${label}</div>` : ''}
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

    // 1. Restaurant Kitchen Marker (Warm Amber Flame)
    L.marker(restaurantCoords, { 
      icon: createGlowingIcon('🍳', '#f59e0b', 'rgba(245, 158, 11, 0.6)', 'KITCHEN') 
    })
      .addTo(map)
      .bindPopup('<strong style="color: #0f172a;">Spice Symphony & Grill</strong><br><small>Kitchen Pickup Point</small>');

    // 2. Delivery Destination Marker (Ice Cyan Doorstep)
    L.marker(deliveryCoords, { 
      icon: createGlowingIcon('📍', '#38bdf8', 'rgba(56, 189, 248, 0.6)', 'CUSTOMER') 
    })
      .addTo(map)
      .bindPopup('<strong style="color: #0f172a;">Customer Doorstep</strong><br><small>Apartment 402, Sunshine Heights</small>');

    // 3. Live Rider Marker (Ather EV Electric Mint with Pulsing Beacon)
    const riderMarker = L.marker(riderCoords, { 
      icon: createGlowingIcon('⚡', '#00e676', 'rgba(0, 230, 118, 0.7)', 'YOU (ATHER EV)') 
    })
      .addTo(map)
      .bindPopup(`<strong style="color: #0f172a;">${riderName}</strong><br><small>Ather 450X • 28 km/h</small>`);
    riderMarkerRef.current = riderMarker;

    // 4. Draw Route Polylines:
    // Glow baseline polyline
    const routeCoords = [restaurantCoords, riderCoords, deliveryCoords];
    if (darkMode) {
      L.polyline(routeCoords, {
        color: '#00e676',
        weight: 8,
        opacity: 0.25,
      }).addTo(map);
    }

    // High-contrast dashed active corridor
    L.polyline(routeCoords, {
      color: darkMode ? '#00e676' : '#ff5722',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.95,
    }).addTo(map);

    // Fit bounds smoothly
    try {
      const group = L.featureGroup([
        L.marker(restaurantCoords),
        L.marker(deliveryCoords),
        L.marker(riderCoords),
      ]);
      map.fitBounds(group.getBounds().pad(0.2));
    } catch (e) {}

    return () => {
      map.remove();
    };
  }, [darkMode]);

  // Real-time coordinates update
  useEffect(() => {
    if (riderMarkerRef.current && riderCoords) {
      riderMarkerRef.current.setLatLng(riderCoords);
    }
  }, [riderCoords]);

  return (
    <div
      ref={mapContainerRef}
      className={darkMode ? 'leaflet-dark-mode-tiles' : ''}
      style={{
        width: '100%',
        height: height,
        borderRadius: '20px',
        overflow: 'hidden',
        background: darkMode ? '#090d16' : '#f1f5f9',
      }}
    />
  );
};

export default LiveMap;
