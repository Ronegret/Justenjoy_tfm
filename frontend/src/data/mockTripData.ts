import { TripData } from '../types/trip';

export const mockTrips: Record<string, TripData> = {
  'justenjoy-lisbon-2026': {
    trip_id: 'justenjoy-lisbon-2026',
    user_preferences: {
      origin: 'Barcelona',
      destination: 'Lisboa',
      dates: {
        start: '2026-05-01',
        end: '2026-05-04',
        flexible: true
      },
      travelers: {
        adults: 2,
        children: 0
      },
      budget: 'balanced',
      budgetAmountUsd: 900,
      style: ['culture', 'food', 'romantic', 'low-walking'],
      restrictions: ['avoid_early_flights', 'central_hotel']
    },
    justgo_score: {
      overall_match: 94,
      price_score: 87,
      comfort_score: 91,
      location_score: 89,
      activities_score: 96,
      friction_score: 12,
      friction_label: 'Baja'
    },
    best_option: {
      title: 'Escapada inteligente a Lisboa',
      destination: 'Lisboa',
      summary: 'La mejor opción por equilibrio entre precio, cercanía, gastronomía, cultura y baja fricción.',
      estimated_total: 620,
      currency: 'EUR',
      why_selected: [
        'Vuelo directo y corto desde Barcelona',
        'Alojamiento céntrico con buena relación calidad/precio',
        'Alta disponibilidad de actividades culturales',
        'Itinerario compacto sin traslados largos',
        'Buena combinación entre planes gratuitos y experiencias de pago'
      ],
      tradeoffs: [
        'No es la opción más barata absoluta',
        'Algunas zonas tienen cuestas, se recomiendan transportes puntuales'
      ]
    },
    alternatives: [
      {
        type: 'cheapest',
        destination: 'Oporto',
        match: 86,
        estimated_total: 540,
        reason: 'Más barato, pero con menor disponibilidad de vuelos directos en horarios cómodos.'
      },
      {
        type: 'premium',
        destination: 'Roma',
        match: 89,
        estimated_total: 780,
        reason: 'Más oferta cultural, pero mayor coste y más fricción por volumen turístico.'
      }
    ],
    flights: [
      {
        provider: 'KAYAK/Amadeus/mock',
        airline: 'Vueling',
        from: 'BCN',
        to: 'LIS',
        departure: '2026-05-01T09:20:00',
        arrival: '2026-05-01T10:15:00',
        duration: '1h 55m',
        stops: 0,
        price: 145,
        baggage: 'Mochila incluida',
        booking_url: '#'
      }
    ],
    hotels: [
      {
        provider: 'Google Hotels/KAYAK/Amadeus/mock',
        name: 'Hotel Lisboa Centro',
        area: 'Baixa-Chiado',
        rating: 4.4,
        price_per_night: 120,
        total_price: 360,
        pros: ['Ubicación céntrica', 'Cerca de metro', 'Buena puntuación'],
        cons: ['Habitaciones pequeñas'],
        booking_url: '#'
      }
    ],
    activities: [
      {
        provider: 'Civitatis/GetYourGuide/Google Places/mock',
        name: 'Tour por Alfama y miradores',
        category: 'Cultura',
        price: 18,
        duration: '2h',
        requires_booking: true,
        opening_hours: '10:00 - 18:00',
        best_time: 'Mañana',
        booking_url: '#',
        why: 'Encaja con interés cultural y minimiza desplazamientos.'
      },
      {
        provider: 'Civitatis/mock',
        name: 'Paseo en Velero por el Tajo al atardecer',
        category: 'Romántico',
        price: 27,
        duration: '2h',
        requires_booking: true,
        opening_hours: '18:00 - 20:00',
        best_time: 'Noche',
        booking_url: '#',
        why: 'Ideal para parejas, vistas increíbles de la ciudad iluminada.'
      }
    ],
    events: [
      {
        provider: 'Ticketmaster/mock',
        name: 'Concierto local Fado',
        date: '2026-05-02',
        time: '21:00',
        price_from: 25,
        venue: 'Lisboa Arena',
        url: '#'
      }
    ],
    itinerary: [
      {
        day: 1,
        date: '2026-05-01',
        title: 'Llegada, centro histórico y cena local',
        summary: 'Primer día suave para llegar, ubicarse y disfrutar sin estrés.',
        blocks: [
          {
            time: '10:15',
            period: 'Mañana',
            title: 'Llegada a Lisboa',
            type: 'flight',
            duration: '1h',
            cost: 0,
            location: 'Aeropuerto de Lisboa',
            description: 'Llegada y traslado al hotel.',
            tip: 'Comprar tarjeta de transporte si se harán varios trayectos.',
            alternative: 'Taxi o Bolt si se viaja con equipaje.',
            lat: 38.7813,
            lng: -9.1359
          },
          {
            time: '13:00',
            period: 'Mediodía',
            title: 'Check-in y comida en Baixa',
            type: 'food',
            duration: '2h',
            cost: 25,
            location: 'Baixa-Chiado',
            description: 'Comida cerca del alojamiento para evitar desplazamientos.',
            tip: 'Reservar si es fin de semana.',
            alternative: 'Comer un pastel de bacalao en el mercado.',
            lat: 38.7107,
            lng: -9.1387
          },
          {
            time: '16:00',
            period: 'Tarde',
            title: 'Paseo por la Plaza del Comercio',
            type: 'activity',
            duration: '2h',
            cost: 0,
            location: 'Praça do Comércio',
            description: 'Explora la plaza más grande de Lisboa y camina por la orilla del Tajo.',
            tip: 'El acceso es libre y es ideal para fotos de tarde.',
            alternative: 'Subir al Arco de la Rua Augusta por 3€.',
            lat: 38.7075,
            lng: -9.1364
          },
          {
            time: '20:30',
            period: 'Noche',
            title: 'Cena con espectáculo de Fado',
            type: 'food',
            duration: '3h',
            cost: 45,
            location: 'Bairro Alto',
            description: 'Disfruta de la comida tradicional portuguesa con música en directo.',
            tip: 'Los mejores sitios de Fado tradicional requieren reserva previa.',
            alternative: 'Cena de tapas en tabernas locales si prefieres algo informal.',
            lat: 38.7139,
            lng: -9.1469
          }
        ]
      },
      {
        day: 2,
        date: '2026-05-02',
        title: 'Barrio de Alfama y paseo fluvial',
        summary: 'Inmersión en la Lisboa medieval, sus miradores y el río.',
        blocks: [
          {
            time: '10:00',
            period: 'Mañana',
            title: 'Tour por Alfama y miradores',
            type: 'activity',
            duration: '2h',
            cost: 18,
            location: 'Barrio de Alfama',
            description: 'Paseo guiado por el barrio más antiguo y con más encanto.',
            tip: 'Lleva calzado cómodo para las calles empedradas.',
            alternative: 'Explorar por libre usando el tranvía histórico 28.',
            lat: 38.7128,
            lng: -9.1303
          },
          {
            time: '13:00',
            period: 'Mediodía',
            title: 'Comida en Time Out Market',
            type: 'food',
            duration: '1.5h',
            cost: 20,
            location: 'Mercado da Ribeira',
            description: 'Mercado gastronómico con puestos de chefs locales e internacionales.',
            tip: 'Suele haber mucha gente; busca sitio para sentarte antes de pedir.',
            alternative: 'Restaurantes tradicionales en los alrededores de Cais do Sodré.',
            lat: 38.7069,
            lng: -9.1459
          },
          {
            time: '18:00',
            period: 'Tarde',
            title: 'Paseo en Velero por el Tajo',
            type: 'activity',
            duration: '2h',
            cost: 27,
            location: 'Dársena de Belém',
            description: 'Observa los monumentos de Lisboa desde una perspectiva única al atardecer.',
            tip: 'Lleva una chaqueta fina ya que en el río refresca al anochecer.',
            alternative: 'Pasear por el paseo marítimo de Belém gratis.',
            lat: 38.6961,
            lng: -9.2160
          },
          {
            time: '21:00',
            period: 'Noche',
            title: 'Concierto local',
            type: 'activity',
            duration: '2h',
            cost: 25,
            location: 'Lisboa Arena',
            description: 'Espectáculo musical en el centro neurálgico cultural.',
            tip: 'Llega 15 minutos antes para pasar el control de accesos.',
            alternative: 'Tomar una copa en las terrazas de Chiado.',
            lat: 38.7679,
            lng: -9.0965
          }
        ]
      },
      {
        day: 3,
        date: '2026-05-03',
        title: 'Sintra y misterios del bosque',
        summary: 'Excursión opcional al majestuoso Palacio de la Pena y sus jardines.',
        blocks: [
          {
            time: '09:00',
            period: 'Mañana',
            title: 'Tren a Sintra y Palacio de la Pena',
            type: 'transit',
            duration: '1.5h',
            cost: 5,
            location: 'Estación de Rossio',
            description: 'Viaje en tren regional a la pintoresca villa de Sintra.',
            tip: 'Compra los billetes el día anterior para evitar colas por la mañana.',
            alternative: 'Alquilar un Uber/Bolt si viajan 3 o 4 personas.',
            lat: 38.7145,
            lng: -9.1394
          },
          {
            time: '11:00',
            period: 'Mañana',
            title: 'Visita Quinta de la Regaleira',
            type: 'activity',
            duration: '2.5h',
            cost: 12,
            location: 'Quinta da Regaleira',
            description: 'Jardines románticos repletos de símbolos templarios, cuevas y el pozo iniciático.',
            tip: 'Es un recorrido muy empinado; tómalo con calma.',
            alternative: 'Visitar el Palacio Nacional en el centro de Sintra.',
            lat: 38.7969,
            lng: -9.3959
          },
          {
            time: '14:00',
            period: 'Mediodía',
            title: 'Almuerzo tradicional en Sintra',
            type: 'food',
            duration: '1.5h',
            cost: 22,
            location: 'Sintra Centro Histórico',
            description: 'Prueba la Queijada y los Travesseiros, dulces típicos de la región.',
            tip: 'Evita los restaurantes en la calle principal; busca en los callejones traseros.',
            lat: 38.7979,
            lng: -9.3907
          },
          {
            time: '17:00',
            period: 'Tarde',
            title: 'Regreso y tarde en LX Factory',
            type: 'activity',
            duration: '3h',
            cost: 0,
            location: 'LX Factory, Alcântara',
            description: 'Espacio industrial reconvertido en centro de arte, tiendas hipster y cafeterías.',
            tip: 'Visita la librería Ler Devagar, una de las más bonitas del mundo.',
            alternative: 'Ir de compras al centro comercial de Amoreiras.',
            lat: 38.7042,
            lng: -9.1778
          }
        ]
      }
    ],
    budget: {
      flights: 290,
      hotel: 360,
      activities: 90,
      transport: 45,
      food: 180,
      extras: 60,
      total: 1025,
      estimatedFields: ['food', 'extras']
    },
    share: {
      private_url: '/trip/justenjoy-lisbon-2026',
      pdf_enabled: true,
      calendar_enabled: true
    }
  },
  'justenjoy-oporto-cheapest': {
    trip_id: 'justenjoy-oporto-cheapest',
    user_preferences: {
      origin: 'Barcelona',
      destination: 'Oporto',
      dates: {
        start: '2026-05-01',
        end: '2026-05-04',
        flexible: true
      },
      travelers: {
        adults: 2,
        children: 0
      },
      budget: 'low',
      budgetAmountUsd: 480,
      style: ['culture', 'food', 'relax'],
      restrictions: ['avoid_early_flights', 'hotel_cheap']
    },
    justgo_score: {
      overall_match: 86,
      price_score: 95,
      comfort_score: 82,
      location_score: 85,
      activities_score: 84,
      friction_score: 22,
      friction_label: 'Baja'
    },
    best_option: {
      title: 'Oporto Low Cost inteligente',
      destination: 'Oporto',
      summary: 'La opción más económica con excelentes planes gratuitos e itinerario relajado.',
      estimated_total: 540,
      currency: 'EUR',
      why_selected: [
        'Vuelo de bajo coste directo',
        'Alojamiento en hostal boutique de alta calificación',
        'Múltiples actividades gratuitas (miradores y paseos en la Ribeira)',
        'Excelentes opciones de comida económica (Francesinhas y petiscos)'
      ],
      tradeoffs: [
        'El hotel no está en el centro histórico exacto',
        'Horario de regreso del vuelo es temprano'
      ]
    },
    alternatives: [
      {
        type: 'balanced',
        destination: 'Lisboa',
        match: 94,
        estimated_total: 620,
        reason: 'Un poco más caro pero con mejor ubicación del hotel y actividades románticas.'
      }
    ],
    flights: [
      {
        provider: 'KAYAK/Amadeus/mock',
        airline: 'Ryanair',
        from: 'BCN',
        to: 'OPO',
        departure: '2026-05-01T12:00:00',
        arrival: '2026-05-01T13:00:00',
        duration: '2h 00m',
        stops: 0,
        price: 90,
        baggage: 'Macho de cabina',
        booking_url: '#'
      }
    ],
    hotels: [
      {
        provider: 'Booking/KAYAK/mock',
        name: 'Oporto Hostel Gallery',
        area: 'Cedofeita',
        rating: 4.6,
        price_per_night: 80,
        total_price: 240,
        pros: ['Diseño moderno', 'Desayuno incluido', 'Ambiente estupendo'],
        cons: ['Baño compartido en opción económica'],
        booking_url: '#'
      }
    ],
    activities: [
      {
        provider: 'Civitatis/mock',
        name: 'Free Tour histórico por Oporto',
        category: 'Cultura',
        price: 0,
        duration: '2.5h',
        requires_booking: true,
        opening_hours: '10:00 - 17:00',
        best_time: 'Mañana',
        booking_url: '#',
        why: 'Introducción perfecta a la historia de la ciudad sin coste inicial.'
      }
    ],
    events: [],
    itinerary: [
      {
        day: 1,
        date: '2026-05-01',
        title: 'Llegada y atardecer en el puente Luis I',
        summary: 'Ubicación y paseo fluvial por la Ribeira.',
        blocks: [
          {
            time: '13:00',
            period: 'Mediodía',
            title: 'Llegada a Oporto',
            type: 'flight',
            duration: '1h',
            cost: 0,
            location: 'Aeropuerto de Oporto',
            description: 'Traslado al hostal en Metro Linea E.',
            tip: 'La tarjeta Andante recargable es la mejor opción para ahorrar.'
          },
          {
            time: '14:30',
            period: 'Mediodía',
            title: 'Comida de Francesinha tradicional',
            type: 'food',
            duration: '1.5h',
            cost: 15,
            location: 'Café Santiago',
            description: 'Prueba el plato estrella de Oporto, la Francesinha.',
            tip: 'Las raciones son muy grandes; se pueden compartir.'
          },
          {
            time: '18:00',
            period: 'Tarde',
            title: 'Atardecer en Jardim del Morro',
            type: 'activity',
            duration: '2h',
            cost: 0,
            location: 'Vila Nova de Gaia',
            description: 'Cruza el puente Luis I a pie y observa el atardecer con música en directo.',
            tip: 'Es un plan gratuito increíble con las mejores vistas de Oporto.'
          }
        ]
      }
    ],
    budget: {
      flights: 180,
      hotel: 240,
      activities: 20,
      transport: 25,
      food: 110,
      extras: 30,
      total: 605,
      estimatedFields: ['food', 'extras']
    },
    share: {
      private_url: '/trip/justenjoy-oporto-cheapest',
      pdf_enabled: true,
      calendar_enabled: true
    }
  },
  'justenjoy-roma-premium': {
    trip_id: 'justenjoy-roma-premium',
    user_preferences: {
      origin: 'Barcelona',
      destination: 'Roma',
      dates: {
        start: '2026-05-01',
        end: '2026-05-04',
        flexible: true
      },
      travelers: {
        adults: 2,
        children: 0
      },
      budget: 'premium',
      budgetAmountUsd: 1800,
      style: ['culture', 'romantic', 'museums'],
      restrictions: ['avoid_early_flights', 'central_hotel']
    },
    justgo_score: {
      overall_match: 89,
      price_score: 74,
      comfort_score: 92,
      location_score: 95,
      activities_score: 98,
      friction_score: 28,
      friction_label: 'Media'
    },
    best_option: {
      title: 'Inmersión Imperial en Roma',
      destination: 'Roma',
      summary: 'La mejor experiencia premium combinando hoteles boutique con entradas prioritarias sin colas.',
      estimated_total: 890,
      currency: 'EUR',
      why_selected: [
        'Vuelo en clase preferente o con extras con ITA Airways',
        'Hotel histórico al lado del Panteón',
        'Entradas VIP sin esperas al Coliseo y Museos Vaticanos',
        'Cena gastronómica en Trastevere reservada previamente'
      ],
      tradeoffs: [
        'Coste elevado del viaje en festivo',
        'Destino con alta masificación turística'
      ]
    },
    alternatives: [
      {
        type: 'balanced',
        destination: 'Lisboa',
        match: 87,
        estimated_total: 620,
        reason: 'Mucho más económico y con menor saturación de turistas.'
      }
    ],
    flights: [
      {
        provider: 'Amadeus/mock',
        airline: 'ITA Airways',
        from: 'BCN',
        to: 'FCO',
        departure: '2026-05-01T10:00:00',
        arrival: '2026-05-01T11:45:00',
        duration: '1h 45m',
        stops: 0,
        price: 210,
        baggage: 'Maleta de cabina + equipaje de mano',
        booking_url: '#'
      }
    ],
    hotels: [
      {
        provider: 'Amadeus/Google Hotels/mock',
        name: 'Pantheon Inn Boutique Hotel',
        area: 'Centro Histórico Roma',
        rating: 4.8,
        price_per_night: 180,
        total_price: 540,
        pros: ['Localización insuperable', 'Desayuno en azotea', 'Edificio del siglo XVII'],
        cons: ['No tiene parking'],
        booking_url: '#'
      }
    ],
    activities: [
      {
        provider: 'Civitatis/mock',
        name: 'Visita guiada Coliseo, Foro y Palatino sin colas',
        category: 'Museos',
        price: 48,
        duration: '3h',
        requires_booking: true,
        opening_hours: '09:00 - 19:00',
        best_time: 'Mañana',
        booking_url: '#',
        why: 'Evita perder hasta 3 horas de cola en taquillas oficiales.'
      }
    ],
    events: [],
    itinerary: [
      {
        day: 1,
        date: '2026-05-01',
        title: 'Roma clásica y cena gourmet',
        summary: 'Llegada y exploración del centro monumental a pie.',
        blocks: [
          {
            time: '12:30',
            period: 'Mediodía',
            title: 'Llegada y check-in',
            type: 'flight',
            duration: '1.5h',
            cost: 0,
            location: 'Aeropuerto Fiumicino',
            description: 'Traslado privado al hotel en coche reservado.',
            tip: 'El traslado privado está incluido en tu tarifa premium.'
          },
          {
            time: '14:00',
            period: 'Mediodía',
            title: 'Almuerzo en Plaza Navona',
            type: 'food',
            duration: '1.5h',
            cost: 40,
            location: 'Piazza Navona',
            description: 'Comida en la tradicional Trattoria al lado de las fuentes barrocas.',
            tip: 'Disfruta de la pasta Cacio e Pepe, especialidad romana.'
          },
          {
            time: '16:00',
            period: 'Tarde',
            title: 'Panteón de Agripa y Fontana de Trevi',
            type: 'activity',
            duration: '3h',
            cost: 5,
            location: 'Centro Histórico',
            description: 'Paseo monumental para lanzar la moneda y ver el templo romano mejor conservado.',
            tip: 'Reserva la entrada al Panteón con antelación, cuesta 5€.'
          }
        ]
      }
    ],
    budget: {
      flights: 420,
      hotel: 540,
      activities: 130,
      transport: 80,
      food: 280,
      extras: 100,
      total: 1550,
      estimatedFields: ['food', 'extras']
    },
    share: {
      private_url: '/trip/justenjoy-roma-premium',
      pdf_enabled: true,
      calendar_enabled: true
    }
  }
};
