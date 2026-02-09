"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ============================================
// TYPES
// ============================================

type Props = {
  lat: number;
  lng: number;
  lotWidth: number;   // feet
  lotDepth: number;   // feet
  address?: string;
  zoningDistrict?: string;
  parcelAreaSqft?: number;
};

// ============================================
// HELPERS — feet to lat/lng offset
// ============================================

function feetToLatLng(lat: number, widthFt: number, depthFt: number) {
  const ftPerDegreeLat = 364000;
  const ftPerDegreeLng = 364000 * Math.cos((lat * Math.PI) / 180);
  return {
    dLat: depthFt / ftPerDegreeLat,
    dLng: widthFt / ftPerDegreeLng,
  };
}

// ============================================
// COMPONENT
// ============================================

export default function SnapshotMap({
  lat,
  lng,
  lotWidth,
  lotDepth,
  address,
  zoningDistrict,
  parcelAreaSqft,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("satellite");

  const SETBACKS = { front: 25, side: 10, rear: 20 };

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous map if exists
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Create map
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 18,
      zoomControl: true,
      attributionControl: true,
    });

    mapRef.current = map;

    // Tile layers
    const streetTiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 20,
      }
    );

    const satelliteTiles = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> World Imagery',
        maxZoom: 20,
      }
    );

    // Add initial layer
    if (mapStyle === "satellite") {
      satelliteTiles.addTo(map);
    } else {
      streetTiles.addTo(map);
    }

    // Layer control
    L.control
      .layers(
        { Street: streetTiles, Satellite: satelliteTiles },
        {},
        { position: "topright" }
      )
      .addTo(map);

    // ---- Draw parcel & overlays ----

    const { dLat, dLng } = feetToLatLng(lat, lotWidth, lotDepth);
    const halfW = dLng / 2;
    const halfD = dLat / 2;

    // Parcel corners (centered on lat/lng)
    const parcelBounds: L.LatLngTuple[] = [
      [lat - halfD, lng - halfW], // SW
      [lat - halfD, lng + halfW], // SE
      [lat + halfD, lng + halfW], // NE
      [lat + halfD, lng - halfW], // NW
    ];

    // Parcel polygon
    L.polygon(parcelBounds, {
      color: "#0071e3",
      weight: 3,
      fillColor: "#0071e3",
      fillOpacity: 0.08,
      dashArray: undefined,
    })
      .addTo(map)
      .bindPopup(
        `<strong>${address || "Property"}</strong><br/>` +
        `${zoningDistrict ? `Zone: ${zoningDistrict}<br/>` : ""}` +
        `${lotWidth}ft x ${lotDepth}ft` +
        `${parcelAreaSqft ? ` (${parcelAreaSqft.toLocaleString()} sqft)` : ""}`
      );

    // Setback polygon (inset)
    const { dLat: dLatFront, dLng: dLngSide } = feetToLatLng(lat, SETBACKS.side, SETBACKS.front);
    const { dLat: dLatRear } = feetToLatLng(lat, 0, SETBACKS.rear);

    const setbackBounds: L.LatLngTuple[] = [
      [lat - halfD + dLatRear, lng - halfW + dLngSide],  // SW inset
      [lat - halfD + dLatRear, lng + halfW - dLngSide],  // SE inset
      [lat + halfD - dLatFront, lng + halfW - dLngSide],  // NE inset
      [lat + halfD - dLatFront, lng - halfW + dLngSide],  // NW inset
    ];

    // Setback zone (area between parcel and buildable)
    L.polygon(parcelBounds, {
      color: "#f59e0b",
      weight: 1,
      fillColor: "#f59e0b",
      fillOpacity: 0.15,
      dashArray: "6,4",
    }).addTo(map);

    // Buildable area
    L.polygon(setbackBounds, {
      color: "#22c55e",
      weight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.15,
      dashArray: "8,4",
    })
      .addTo(map)
      .bindPopup(
        `<strong>Buildable Area</strong><br/>` +
        `Setbacks: Front ${SETBACKS.front}ft, Side ${SETBACKS.side}ft, Rear ${SETBACKS.rear}ft`
      );

    // Property marker
    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        width: 32px; height: 32px;
        background: #0071e3;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([lat, lng], { icon: markerIcon })
      .addTo(map)
      .bindPopup(`<strong>${address || "Property Location"}</strong>`);

    // Setback labels
    const labelStyle = `
      background: rgba(245,158,11,0.9);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      white-space: nowrap;
      border: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    `;

    // Front setback label (top)
    L.marker([lat + halfD - dLatFront / 2, lng], {
      icon: L.divIcon({
        className: "",
        html: `<div style="${labelStyle}">${SETBACKS.front}ft Front</div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10],
      }),
    }).addTo(map);

    // Rear setback label (bottom)
    L.marker([lat - halfD + dLatRear / 2, lng], {
      icon: L.divIcon({
        className: "",
        html: `<div style="${labelStyle}">${SETBACKS.rear}ft Rear</div>`,
        iconSize: [80, 20],
        iconAnchor: [40, 10],
      }),
    }).addTo(map);

    // Side labels
    L.marker([lat, lng - halfW + dLngSide / 2], {
      icon: L.divIcon({
        className: "",
        html: `<div style="${labelStyle}">${SETBACKS.side}ft</div>`,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    L.marker([lat, lng + halfW - dLngSide / 2], {
      icon: L.divIcon({
        className: "",
        html: `<div style="${labelStyle}">${SETBACKS.side}ft</div>`,
        iconSize: [40, 20],
        iconAnchor: [20, 10],
      }),
    }).addTo(map);

    // Fit to parcel with padding
    map.fitBounds(parcelBounds as L.LatLngBoundsExpression, { padding: [40, 40] });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, lotWidth, lotDepth, mapStyle]);

  return (
    <div className="relative w-full h-[600px]">
      <div ref={containerRef} className="w-full h-full rounded-xl z-0" />

      {/* Map style toggle */}
      <div className="absolute top-3 left-3 z-[1000] flex gap-1 bg-white rounded-lg shadow-lg p-1">
        <button
          onClick={() => setMapStyle("satellite")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
            mapStyle === "satellite"
              ? "bg-[#0071e3] text-white"
              : "text-[#6e6e73] hover:bg-[#f5f5f7]"
          }`}
        >
          Satellite
        </button>
        <button
          onClick={() => setMapStyle("street")}
          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
            mapStyle === "street"
              ? "bg-[#0071e3] text-white"
              : "text-[#6e6e73] hover:bg-[#f5f5f7]"
          }`}
        >
          Street
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-[11px]">
        <div className="font-semibold text-[#1d1d1f] mb-1.5">Legend</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-0.5 bg-[#0071e3]" style={{ border: "1.5px solid #0071e3" }} />
          <span className="text-[#6e6e73]">Parcel Boundary</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-3 rounded-sm" style={{ background: "rgba(245,158,11,0.3)", border: "1px dashed #f59e0b" }} />
          <span className="text-[#6e6e73]">Setback Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 rounded-sm" style={{ background: "rgba(34,197,94,0.2)", border: "1px dashed #22c55e" }} />
          <span className="text-[#6e6e73]">Buildable Area</span>
        </div>
      </div>
    </div>
  );
}
