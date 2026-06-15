"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import reports from "../../../../reports.json";

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  status: string;
  location: string;
}

interface Zone {
  lat: number;
  lng: number;
  radius: number;
  name: string;
  color: string;
}

const HeatLayer = ({ points }: { points: Array<[number, number, number]> }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0 && (window as any).L?.heatLayer) {
      const L = (window as any).L;
      const heat = L.heatLayer(points, {
        radius: 30,
        blur: 20,
        maxZoom: 17,
        max: 1,
        gradient: {
          0.0: "#22c55e",
          0.3: "#eab308",
          0.5: "#f97316",
          0.7: "#ef4444",
          1.0: "#991b1b",
        },
      });

      heat.addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [points, map]);

  return null;
};

const HeatMap = () => {
  const [heatmapData, setHeatmapData] = useState<Array<[number, number, number]>>([]);

  useEffect(() => {
    setHeatmapData(
      reports.reports.map((report) => [
        report.coordinates.lat,
        report.coordinates.lng,
        report.status === "Pending" ? 1 : report.status === "Resolved" ? 0.1 : 0.5,
      ])
    );
  }, []);

  const zones: Zone[] = [
    { lat: 28.5921, lng: 77.046, radius: 3000, name: "Dwarka Priority Zone", color: "#ef4444" },
    { lat: 28.741, lng: 77.052, radius: 3000, name: "Rohini Priority Zone", color: "#ef4444" },
    { lat: 28.5709, lng: 77.2373, radius: 2500, name: "Lajpat Nagar Zone", color: "#f59e0b" },
    { lat: 28.6289, lng: 77.2074, radius: 2000, name: "Connaught Place Zone", color: "#22c55e" },
  ];

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer
        center={[28.7, 77.2]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <HeatLayer points={heatmapData} />
        {zones.map((zone, i) => (
          <Circle
            key={`zone-${i}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: zone.color,
              fillColor: zone.color,
              fillOpacity: 0.08,
              weight: 2,
              dashArray: "6 6",
            }}
          >
          </Circle>
        ))}
      </MapContainer>
    </div>
  );
};

export default HeatMap;
