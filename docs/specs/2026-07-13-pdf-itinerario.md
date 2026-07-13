# Especificación: Descarga del itinerario en PDF

## 1. Qué hace y qué NO hace
- **Hace:**
  - Al pulsar el botón de descarga del hero en la página de viaje (`/trip/[id]`), genera
    y descarga un fichero PDF con toda la información del viaje.
  - Compone el PDF a medida desde el objeto `trip` (`TripData`) ya disponible en cliente,
    usando `@react-pdf/renderer`. El texto resultante es seleccionable (no es una captura
    de pantalla rasterizada).
  - Incluye: cabecera (título, destino, fechas, viajeros, presupuesto, match JustGo,
    resumen), por qué esta opción y tradeoffs, itinerario día a día con sus bloques,
    vuelo recomendado, hotel recomendado, desglose de presupuesto y lista de ubicaciones.
- **NO hace:**
  - No embebe el mapa interactivo de Google Maps (se sustituye por una lista de
    ubicaciones con coordenadas por día).
  - No genera el PDF en servidor ni añade un endpoint nuevo; todo ocurre en el navegador.
  - No modifica el contrato del webhook ni el JSON de `/api/plan-trip`.

## 2. Flujo de usuario paso a paso
1. El usuario abre un viaje generado en `/trip/session_XXXX`.
2. Pulsa el icono de descarga ("Descargar itinerario PDF") en el hero.
3. El botón entra en estado "generando" (deshabilitado) mientras se compone el documento.
4. El navegador descarga un fichero `viaje-<destino>-<fecha_inicio>.pdf`.
5. Si algo falla, se muestra un aviso legible y el botón vuelve a su estado normal.

## 3. Qué puede salir mal
- **Compatibilidad de `@react-pdf/renderer` con React 19 / Next 16:** se usa la v4
  (peer dependency incluye React 19) y se importa de forma **dinámica** dentro del
  handler para no entrar en el bundle de servidor / SSR.
- **Imágenes remotas (hero, fotos de bloques de Google Places):** su carga en el PDF es
  lenta o puede fallar por CORS. Solución: son best-effort; el PDF es text-first y no
  depende de ellas.
- **Viajes largos:** el documento debe paginar correctamente varias páginas (se apoya en
  el flujo automático de páginas de `@react-pdf/renderer` y en `wrap`).

## 4. Qué partes del repo toca
- `frontend/src/components/trip/TripPdfDocument.tsx` (nuevo): documento PDF.
- `frontend/src/lib/tripPdf.ts` (nuevo): helper `downloadTripPdf(trip)`.
- `frontend/src/app/trip/[id]/page.tsx`: sustituye el `alert` del `onPdf` por el handler
  real con estado de carga.
- `frontend/src/components/trip/PrivateTripHero.tsx`: prop opcional para reflejar el
  estado "generando".
- `frontend/package.json` + `package-lock.json`: dependencia `@react-pdf/renderer`.

## 5. Decisiones confirmadas
- Técnica: **`@react-pdf/renderer`** (composición desde datos), elegida por el usuario
  frente a `window.print()` y `jsPDF + html2canvas`.
- Generación **en cliente**, sin endpoint nuevo.
- El mapa interactivo se sustituye por una lista de ubicaciones; una imagen de mapa
  estático queda como posible extensión futura (clave de servidor `GOOGLE_PLACES_API_KEY`).
