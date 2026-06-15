"use client";
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import reports from "../../../../reports.json";

interface Location {
  lat: number;
  lng: number;
  status: string;
  location: string;
  id: string;
}

const LocationMap = () => {
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    setLocations(
      reports.reports.map((report) => ({
        lat: report.coordinates.lat,
        lng: report.coordinates.lng,
        status: report.status,
        location: report.location,
        id: report.id,
      }))
    );
  }, []);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "Pending":
        return { color: "#ef4444", fillColor: "#ef4444" }; // red
      case "Resolved":
        return { color: "#22c55e", fillColor: "#22c55e" }; // green
      default:
        return { color: "#f59e0b", fillColor: "#f59e0b" }; // amber
    }
  };

  const getMarkerRadius = (status: string) => {
    switch (status) {
      case "Pending":
        return 8;
      case "Resolved":
        return 5;
      default:
        return 6;
    }
  };

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
        {locations.length > 0 && (
          <>
            {locations.map((loc, index) => {
              const colors = getMarkerColor(loc.status);
              return (
                <CircleMarker
                  key={index}
                  center={[loc.lat, loc.lng]}
                  radius={getMarkerRadius(loc.status)}
                  color={colors.color}
                  fillColor={colors.fillColor}
                  fillOpacity={0.8}
                  weight={2}
                >
                  <Tooltip direction="top" offset={[0, -10]} permanent={false}>
                    <div className="text-xs font-semibold">
                      {loc.location}
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold text-sm mb-1">{loc.location}</p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${loc.status === "Pending"
                            ? "bg-red-100 text-red-700"
                            : loc.status === "Resolved"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {loc.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        ID: #{loc.id}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
            {/* Target zone overlay - Dwarka, Rohini, Lajpat Nagar as priority zones */}
            {[
              { lat: 28.5921, lng: 77.046, label: "Dwarka Zone", color: "#ef4444" },
              { lat: 28.741, lng: 77.052, label: "Rohini Zone", color: "#ef4444" },
              { lat: 28.5709, lng: 77.2373, label: "Lajpat Nagar Zone", color: "#f59e0b" },
            ].map((zone, i) => (
              <CircleMarker
                key={`zone-${i}`}
                center={[zone.lat, zone.lng]}
                radius={20}
                color={zone.color}
                fillColor={zone.color}
                fillOpacity={0.1}
                weight={2}
                dashArray="4"
              >
                <Tooltip permanent direction="top">
                  <span className="text-xs font-bold">{zone.label}</span>
                </Tooltip>
              </CircleMarker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;
