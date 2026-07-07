"use client";

import React, { useState } from "react";
import Image from "next/image";

interface DestinationImageProps {
  destination: string;
  imageUrl?: string;
  alt?: string;
  className?: string;
}

export default function DestinationImage({
  destination,
  imageUrl,
  alt,
  className = "w-full h-48 object-cover rounded-xl shadow-sm",
}: DestinationImageProps) {
  const [error, setError] = useState(false);

  // Si no hay URL proporcionada por el backend, o si la imagen falla al cargar,
  // mostramos un placeholder elegante basado en el nombre del destino.
  // En un sistema real de producción, el backend (n8n/GPT) debería devolvernos una `imageUrl`
  // real obtenida de Google Places API o Unsplash.
  const finalImageUrl = error || !imageUrl
    ? `https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop` // Placeholder de viaje
    : imageUrl;

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
