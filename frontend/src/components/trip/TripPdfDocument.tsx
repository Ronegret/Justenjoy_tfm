'use client';

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';
import { TripData } from '@/types/trip';
import { budgetLabel } from '@/lib/tripLabels';

// Paleta de marca (espejo de globals.css @theme). @react-pdf no lee Tailwind,
// así que replicamos los colores como constantes.
const COLORS = {
  dark: '#0A1120',
  blue: '#2563EB',
  coral: '#F26444',
  teal: '#10B981',
  cream: '#FAF8F5',
  white: '#FFFFFF',
  muted: '#64748B',
  border: '#E2E8F0',
};

const eur = (value: number | undefined) =>
  typeof value === 'number' ? `${value.toLocaleString('es-ES')} €` : '—';

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.dark,
    lineHeight: 1.4,
  },
  // Cabecera
  hero: {
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    borderRadius: 10,
    padding: 20,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: COLORS.teal,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 10,
    color: COLORS.cream,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
  },
  stat: {
    marginRight: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 7,
    color: 'rgba(250,248,245,0.6)',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  // Secciones
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.dark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  paragraph: {
    marginBottom: 6,
    color: COLORS.dark,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletDot: {
    width: 10,
    color: COLORS.teal,
    fontFamily: 'Helvetica-Bold',
  },
  // Día
  dayCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.blue,
  },
  dayDate: {
    fontSize: 9,
    color: COLORS.muted,
  },
  daySummary: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  block: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  blockTime: {
    width: 52,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.coral,
    fontSize: 9,
  },
  blockBody: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 8,
  },
  blockTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  blockMeta: {
    fontSize: 8,
    color: COLORS.muted,
    marginBottom: 2,
  },
  blockDesc: {
    fontSize: 9,
  },
  blockTip: {
    fontSize: 8,
    color: COLORS.teal,
    marginTop: 2,
  },
  // Fichas (vuelo / hotel) y presupuesto
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  // Tarjeta a ancho completo (presupuesto). No usa flex: 1 porque, como hijo
  // único de una columna de altura automática, flexBasis:0 colapsaría su altura
  // y las filas se solaparían.
  fullCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  rowLabel: {
    color: COLORS.muted,
    fontSize: 9,
  },
  rowValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.dark,
    paddingTop: 6,
    marginTop: 4,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLORS.blue,
  },
  locItem: {
    fontSize: 9,
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  // Encabezado repetido desde la página 2 (se posiciona en absoluto para no
  // empujar el hero de la página 1; el paddingTop de la página deja el hueco).
  headerSlot: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
    color: COLORS.muted,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  headerBrand: {
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
    color: COLORS.dark,
  },
});

interface TripPdfDocumentProps {
  trip: TripData;
}

export const TripPdfDocument: React.FC<TripPdfDocumentProps> = ({ trip }) => {
  const { user_preferences: prefs, best_option, justgo_score, budget } = trip;
  const flight = trip.flights?.[0];
  const hotel = trip.hotels?.[0];
  const travelersLabel =
    `${prefs.travelers.adults} ${prefs.travelers.adults === 1 ? 'Adulto' : 'Adultos'}` +
    (prefs.travelers.children > 0 ? `, ${prefs.travelers.children} Niños` : '');

  const budgetLines: Array<[string, number]> = [
    ['Vuelos', budget.flights],
    ['Hotel', budget.hotel],
    ['Actividades', budget.activities],
    ['Transporte', budget.transport],
    ['Comida', budget.food],
    ['Extras', budget.extras],
  ];

  return (
    <Document
      title={`Itinerario ${best_option.destination}`}
      author="Just Enjoy"
    >
      <Page size="A4" style={styles.page} wrap>
        {/* Encabezado repetido a partir de la página 2 (incluida) */}
        <View
          style={styles.headerSlot}
          fixed
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <View style={styles.header}>
                <Text style={styles.headerBrand}>JUST ENJOY</Text>
                <Text>Viaje a {best_option.destination}</Text>
              </View>
            ) : null
          }
        />

        {/* Cabecera */}
        <View style={styles.hero}>
          <Text style={styles.kicker}>RUTA OPTIMIZADA · JUST ENJOY</Text>
          <Text style={styles.heroTitle}>{best_option.title}</Text>
          <Text style={styles.heroSubtitle}>
            Un viaje personalizado a {best_option.destination} creado por la IA de Just Enjoy.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>FECHAS</Text>
              <Text style={styles.statValue}>
                {prefs.dates.start} al {prefs.dates.end}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>PASAJEROS</Text>
              <Text style={styles.statValue}>{travelersLabel}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>PRESUPUESTO</Text>
              <Text style={styles.statValue}>{budgetLabel(prefs.budget)}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>MATCH JUSTGO</Text>
              <Text style={styles.statValue}>{justgo_score.overall_match}%</Text>
            </View>
          </View>
        </View>

        {/* Resumen / por qué esta opción */}
        {(best_option.summary || best_option.why_selected?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sobre este viaje</Text>
            {best_option.summary ? (
              <Text style={styles.paragraph}>{best_option.summary}</Text>
            ) : null}
            {best_option.why_selected?.map((reason, i) => (
              <View style={styles.bullet} key={`why-${i}`}>
                <Text style={styles.bulletDot}>+</Text>
                <Text style={{ flex: 1 }}>{reason}</Text>
              </View>
            ))}
            {best_option.tradeoffs?.map((t, i) => (
              <View style={styles.bullet} key={`trade-${i}`}>
                <Text style={[styles.bulletDot, { color: COLORS.coral }]}>!</Text>
                <Text style={{ flex: 1, color: COLORS.muted }}>{t}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Itinerario día a día */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinerario detallado día a día</Text>
          {trip.itinerary?.map((day) => (
            <View style={styles.dayCard} key={`day-${day.day}`} wrap={false}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>
                  Día {day.day} · {day.title}
                </Text>
                <Text style={styles.dayDate}>{day.date}</Text>
              </View>
              {day.summary ? <Text style={styles.daySummary}>{day.summary}</Text> : null}
              {day.blocks?.map((block, bi) => (
                <View style={styles.block} key={`block-${day.day}-${bi}`}>
                  <Text style={styles.blockTime}>{block.time}</Text>
                  <View style={styles.blockBody}>
                    <Text style={styles.blockTitle}>{block.title}</Text>
                    <Text style={styles.blockMeta}>
                      {[
                        block.period,
                        block.location,
                        block.duration,
                        typeof block.cost === 'number'
                          ? (block.cost > 0 ? eur(block.cost) : 'Gratis')
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    {block.description ? (
                      <Text style={styles.blockDesc}>{block.description}</Text>
                    ) : null}
                    {block.tip ? (
                      <Text style={styles.blockTip}>Tip: {block.tip}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Billetes y reservas */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Billetes & reservas recomendadas</Text>
          <View style={styles.twoCol}>
            {flight ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Vuelo · {flight.airline}</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Trayecto</Text>
                  <Text style={styles.rowValue}>{flight.from} - {flight.to}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Salida</Text>
                  <Text style={styles.rowValue}>{flight.departure}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Llegada</Text>
                  <Text style={styles.rowValue}>{flight.arrival}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Duración / escalas</Text>
                  <Text style={styles.rowValue}>
                    {flight.duration} · {flight.stops === 0 ? 'Directo' : `${flight.stops} escala(s)`}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Equipaje</Text>
                  <Text style={styles.rowValue}>{flight.baggage}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Precio</Text>
                  <Text style={styles.rowValue}>{eur(flight.price)}</Text>
                </View>
              </View>
            ) : null}
            {hotel ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Hotel · {hotel.name}</Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Zona</Text>
                  <Text style={styles.rowValue}>{hotel.area}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Valoración</Text>
                  <Text style={styles.rowValue}>{hotel.rating} / 5</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Precio / noche</Text>
                  <Text style={styles.rowValue}>{eur(hotel.price_per_night)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Precio total</Text>
                  <Text style={styles.rowValue}>{eur(hotel.total_price)}</Text>
                </View>
                {hotel.pros?.length ? (
                  <Text style={[styles.blockMeta, { marginTop: 4 }]}>
                    A favor: {hotel.pros.join(', ')}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>

        {/* Presupuesto */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Estudio de costes estimados</Text>
          <View style={styles.fullCard}>
            {budgetLines.map(([label, value]) => (
              <View style={styles.row} key={`bud-${label}`}>
                <Text style={styles.rowLabel}>{label}</Text>
                <Text style={styles.rowValue}>{eur(value)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.totalValue}>{eur(budget.total)}</Text>
            </View>
          </View>
        </View>

        {/* Ubicaciones (sustituto del mapa) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ubicaciones del itinerario</Text>
          {trip.itinerary?.map((day) => {
            const located = day.blocks?.filter(
              (b) => typeof b.lat === 'number' && typeof b.lng === 'number'
            );
            if (!located || located.length === 0) return null;
            return (
              <View key={`loc-${day.day}`} style={{ marginBottom: 6 }}>
                <Text style={[styles.rowValue, { marginBottom: 2 }]}>
                  Día {day.day} · {day.title}
                </Text>
                {located.map((b, i) => (
                  <Text style={styles.locItem} key={`loc-${day.day}-${i}`}>
                    • {b.title}
                    {b.location ? ` — ${b.location}` : ''} ({b.lat?.toFixed(4)}, {b.lng?.toFixed(4)})
                  </Text>
                ))}
              </View>
            );
          })}
        </View>

        {/* Pie con paginación */}
        <View style={styles.footer} fixed>
          <Text>Just Enjoy · {best_option.destination}</Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};

export default TripPdfDocument;
