"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import reports from "../../../../reports.json";

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      const heat = L.heatLayer(points, {
        radius: 25, // Radius of each point on the heatmap
        blur: 15, // Blur effect
        maxZoom: 17, // Maximum zoom level
        max: 1, // Maximum intensity
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
  const [heatmapData, setHeatmapData] = useState([]);

  useEffect(() => {
    setHeatmapData(
      reports.reports.map((report) => [
        report.coordinates.lat,
        report.coordinates.lng,
        report.status === "Pending" ? 1 : 0.45,
      ])
    );
  }, []);

  return (
    <div className="card border border-gray-400 w-full h-48 m-3">
      <MapContainer
        center={[28.7, 77.2]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <HeatLayer points={heatmapData} />
      </MapContainer>
    </div>
  );
};

export default HeatMap;
