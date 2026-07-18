'use client';

import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';

interface CitySelection {
  city: string;
  country: string;
}

interface CityAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onCitySelected?: (selection: CitySelection) => void;
  placeholder?: string;
  className?: string;
}

// Extrae SOLO el nombre de la ciudad (sin país) de un resultado de Google
// Places: n8n resuelve el destino con una tabla plana `cityToIata` que hace
// match EXACTO por nombre de ciudad en minúsculas (05_convertir_iata.js) — si
// mandáramos "Valencia, España" en vez de "Valencia" dejaría de encontrar la
// ciudad. `postal_town`/`administrative_area_level_2` son fallback: algunas
// ciudades del Reino Unido no tienen `locality` (usan postal_town), y alguna
// pedanía pequeña puede no tener ninguno de los dos.
function extractCitySelection(place: google.maps.places.PlaceResult): CitySelection | null {
  const components = place.address_components;
  if (!components) return null;
  const locality = components.find((c) => c.types.includes('locality'))
    || components.find((c) => c.types.includes('postal_town'))
    || components.find((c) => c.types.includes('administrative_area_level_2'));
  const country = components.find((c) => c.types.includes('country'));
  const city = locality?.long_name || place.name;
  if (!city) return null;
  return { city, country: country?.long_name || '' };
}

function AutocompleteField({ value, onChange, onCitySelected, placeholder, className }: CityAutocompleteInputProps) {
  const placesLib = useMapsLibrary('places');
  const inputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;
    // Restringido a ciudades ("(cities)"): un país o región no aparece nunca
    // como sugerencia, así que ya no hace falta que el usuario acierte a
    // escribir una ciudad de memoria — elige de una lista de lugares reales.
    const ac = new placesLib.Autocomplete(inputRef.current, {
      types: ['(cities)'],
      fields: ['address_components', 'name', 'formatted_address']
    });
    setAutocomplete(ac);
    return () => {
      google.maps.event.clearInstanceListeners(ac);
    };
  }, [placesLib]);

  useEffect(() => {
    if (!autocomplete) return;
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const selection = extractCitySelection(place);
      if (selection) {
        // El widget de Google escribe él mismo en el input el texto completo
        // de la sugerencia ("València, Spain") en cuanto se elige, antes de
        // que se dispare este evento — como el input es no-controlado (ver
        // comentario más abajo), hay que sobrescribirlo a mano para que
        // muestre solo el nombre de ciudad que realmente se envía (evita que
        // el cuadro diga una cosa y la confirmación de abajo diga otra).
        if (inputRef.current) inputRef.current.value = selection.city;
        onChange(selection.city);
        onCitySelected?.(selection);
      }
    });
    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autocomplete]);

  return (
    // No-controlado a propósito (defaultValue, no value): el widget de Google
    // escribe directamente en el DOM del input al mostrar/elegir sugerencias,
    // y un input controlado por React pelearía con esa escritura directa en
    // cada render. El valor "real" vive en el estado del padre (`value`) y se
    // sincroniza hacia el DOM solo cuando corresponde (ver arriba).
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    />
  );
}

// Envuelve su propio APIProvider (igual que TripMapOverview) para poder
// usarse suelto en cualquier paso del formulario sin depender de un
// proveedor externo. Si no hay API key configurada cae a un input de texto
// normal — el buscador sigue funcionando, solo sin autocompletar.
export function CityAutocompleteInput(props: CityAutocompleteInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const hasApiKey = !!apiKey && apiKey !== 'changeme';

  if (!hasApiKey) {
    return (
      <input
        type="text"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={props.className}
      />
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <AutocompleteField {...props} />
    </APIProvider>
  );
}

export default CityAutocompleteInput;
