import React, { useEffect, useRef } from "react";
import L from "leaflet";
const valid = (coords) =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  coords.every((v) => v != null && Number.isFinite(Number(v))) &&
  Math.abs(Number(coords[0])) <= 90 &&
  Math.abs(Number(coords[1])) <= 180;
export default function LiveMap({
  restaurantCoords = null,
  deliveryCoords = null,
  riderCoords = null,
  riderName = "Delivery partner",
  height = "380px",
  darkMode = false,
  interactive = true,
}) {
  const container = useRef(null);
  const points = [restaurantCoords, deliveryCoords, riderCoords].filter(valid);
  const key = JSON.stringify([
    restaurantCoords,
    deliveryCoords,
    riderCoords,
    riderName,
    darkMode,
    interactive,
  ]);
  useEffect(() => {
    if (!container.current || !points.length) return;
    const map = L.map(container.current, {
      center: points[0],
      zoom: 15,
      scrollWheelZoom: interactive,
      dragging: interactive,
      touchZoom: interactive,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    [
      [restaurantCoords, "Kitchen"],
      [deliveryCoords, "Delivery address"],
      [riderCoords, riderName],
    ].forEach(([coords, label]) => {
      if (!valid(coords)) return;
      const text = document.createElement("span");
      text.textContent = label;
      L.marker(coords).addTo(map).bindPopup(text);
    });
    if (points.length > 1) map.fitBounds(L.latLngBounds(points).pad(0.2));
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [key]);
  return points.length ? (
    <div
      ref={container}
      className={darkMode ? "leaflet-dark-mode-tiles" : ""}
      style={{ width: "100%", height, borderRadius: 20 }}
      aria-label="Delivery locations map"
    />
  ) : (
    <div
      role="status"
      className="d-flex align-items-center justify-content-center text-secondary rounded-4 border p-4"
      style={{ height, background: darkMode ? "#101827" : "#f8fafc" }}
    >
      Live location is not available yet.
    </div>
  );
}
