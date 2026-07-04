# Especificación: Gestión Dinámica de Imágenes y Mapas de Destino

## 1. Qué hace y qué NO hace
- **Hace:**
  - Obtiene imágenes de destinos de forma dinámica utilizando la API de Google Places (o alternativa similar aprobada).
  - Optimiza las imágenes automáticamente en el frontend utilizando `next/image` para unificar formatos (ej. WebP) y tamaños.
  - Muestra un mapa interactivo del destino utilizando Google Maps JavaScript API (o `iframe` embebido en caso de versión sin API Key compleja, según configurado).
- **NO hace:**
  - No descarga ni almacena ficheros de imágenes estáticos por cada ciudad en el repositorio (evita problemas de tamaño y escalabilidad).
  - No requiere actualizaciones manuales de código cada vez que un usuario busca un destino nuevo.

## 2. Flujo de usuario paso a paso
1. El usuario introduce un destino en la plataforma o el sistema genera un itinerario.
2. El frontend (Next.js) solicita renderizar el destino.
3. El componente `DestinationImage` consulta dinámicamente la imagen representativa del lugar (vía API o recibiendo la URL pre-cargada del backend).
4. El navegador descarga la imagen ya optimizada y redimensionada por Next.js.
5. En la sección de itinerario o detalle de ciudad/restaurante, el componente `MapViewer` renderiza un mapa de Google centrado en las coordenadas correspondientes, permitiendo al usuario interactuar con él (zoom, paneo).

## 3. Qué puede salir mal
- **Límites de cuota de API:** Si se usa la API de Google Places de pago y hay mucho tráfico, podrían haber sobrecostes o la API podría denegar solicitudes. (Solución: caching de URLs en base de datos si es necesario en el futuro).
- **Destinos oscuros/sin imagen:** Que Google no tenga una imagen de calidad para un destino muy pequeño. (Solución: mostrar imagen de _fallback_ o placeholder elegante).
- **Problemas de CSP (Content Security Policy) o configuración Next.js:** Que Next.js bloquee la optimización de imágenes externas si no están autorizados los dominios de Google en `next.config.ts`. (Solución: configurar dominios correctamente).

## 4. Qué partes del repo toca
- `frontend/next.config.ts`: Para habilitar la optimización de imágenes de dominios externos (ej. `maps.googleapis.com` o `places.googleapis.com`).
- `frontend/src/components/trip/DestinationImage.tsx` (Nuevo componente).
- `frontend/src/components/trip/MapViewer.tsx` (Nuevo componente interactivo).
- Ficheros de variables de entorno `.env.example` y `.env` para incluir `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.
- Secciones de la UI (ej. `ItineraryTimeline`, `DayPlanCard`) para inyectar estos nuevos componentes.

## 5. Decisiones confirmadas
- Utilizar recursos dinámicos de **Google** (Places API / Maps API).
- Emplear un **mapa interactivo** en lugar de imágenes estáticas para los mapas.
- Evitar ficheros locales en el código fuente para garantizar la escalabilidad y limpieza del proyecto.
