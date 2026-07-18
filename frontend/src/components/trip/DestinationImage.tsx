"use client";

import React, { useState } from "react";
import Image from "next/image";

interface DestinationImageProps {
  destination: string;
  imageUrl?: string;
  // Foto real del destino (ciudad) del viaje, no de esta parada en concreto —
  // se usa como segundo intento antes del placeholder genérico. Antes, en
  // cuanto faltaba la foto de la parada (siempre en los viajes de demo, y a
  // veces en un viaje real si Google Places no encontró el lugar exacto),
  // TODAS las paradas mostraban la misma foto de stock sin relación con el
  // destino (un ala de avión al atardecer) — ver DayPlanCard/mockTripData.
  fallbackImageUrl?: string;
  alt?: string;
  className?: string;
}

export default function DestinationImage({
  destination,
  imageUrl,
  fallbackImageUrl,
  alt,
  className = "w-full h-48 object-cover rounded-xl shadow-sm",
}: DestinationImageProps) {
  const [error, setError] = useState(false);

  // Prioridad: foto real de esta parada > foto real del destino > placeholder
  // genérico de viaje (último recurso, cuando no tenemos ninguna foto real).
  const finalImageUrl = !error && imageUrl
    ? imageUrl
    : fallbackImageUrl || `https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop`; // Placeholder de viaje

  return (
    <div className="relative">
      {/*
        Usamos next/image para optimización automática (WebP, resizing).
        Asegúrate de que los dominios de las imágenes estén en next.config.ts
      */}
      <Image
        src={finalImageUrl}
        alt={alt || `Imagen de ${destination}`}
        width={800}
        height={400}
        className={className}
        onError={() => setError(true)}
      />
      {/* Overlay opcional para mostrar el nombre si no hay otra UI */}
      {(!imageUrl || error) && (
        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-end p-4">
          <span className="text-white font-semibold drop-shadow-md">
            {destination}
          </span>
        </div>
      )}
    </div>
  );
}
