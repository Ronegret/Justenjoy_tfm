"use client";

import React from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

interface MapViewerProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  title?: string;
}

export default function MapViewer({
  latitude,
  longitude,
  zoom = 13,
  title,
}: MapViewerProps) {
  const position = { lat: latitude, lng: longitude };

  // Clave pública (si no está, el mapa fallará con un error en consola, pero no crasheará la app entera si se controla)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  if (!apiKey || apiKey === "changeme") {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-gray-200">
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>Configura tu Google Maps API Key para ver el mapa interactivo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-80 rounded-xl overflow-hidden shadow-sm border border-gray-200">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={position}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          <Marker position={position} title={title} />
        </Map>
      </APIProvider>
    </div>
  );
}
