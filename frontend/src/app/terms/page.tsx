import { FileText } from 'lucide-react';
import Link from 'next/link';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Términos y Condiciones — Just Enjoy',
  description: 'Condiciones de uso del planificador de viajes Just Enjoy.',
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      icon={FileText}
      eyebrow="Condiciones"
      title="Términos y Condiciones"
      lastUpdated="18 de julio de 2026"
      intro="Al usar Just Enjoy aceptas estas condiciones. Las hemos escrito intentando que sean claras, no un muro de letra pequeña."
    >
      <LegalSection title="1. Qué es Just Enjoy">
        <p>
          Just Enjoy es un planificador de viajes asistido por inteligencia artificial, desarrollado
          como Trabajo Final de Máster (TFM) en EBIS Business Techschool. Su objetivo es proponerte
          un itinerario completo — vuelos, alojamiento, actividades y presupuesto — a partir de tus
          preferencias.
        </p>
      </LegalSection>

      <LegalSection title="2. Los planes son propuestas, no reservas">
        <p>
          Todo lo que te mostramos (precios de vuelos, hoteles y actividades) proviene de búsquedas
          reales en el momento de generar tu plan, pero <strong className="text-brand-dark">no son
          reservas confirmadas</strong>. Los enlaces de vuelos y hoteles te llevan a la página de
          búsqueda del proveedor correspondiente (Google Flights, el hotel, etc.), donde debes
          verificar precio y disponibilidad reales antes de pagar. Los precios pueden cambiar entre
          el momento en que generamos tu plan y el momento en que reservas.
        </p>
      </LegalSection>

      <LegalSection title="3. Tu cuenta">
        <p>
          Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad que
          ocurra desde tu cuenta. Avísanos si crees que alguien más ha accedido a ella.
        </p>
      </LegalSection>

      <LegalSection title="4. Uso aceptable">
        <p>
          Te pedimos que uses Just Enjoy de forma razonable: no automatices peticiones masivas al
          planificador ni intentes sobrecargar el servicio. Al ser un proyecto académico con
          proveedores de pago (búsqueda de vuelos, IA), un uso abusivo puede obligarnos a limitar o
          suspender el acceso a tu cuenta.
        </p>
      </LegalSection>

      <LegalSection title="5. Contenido generado por IA">
        <p>
          Los itinerarios, descripciones y recomendaciones se generan con modelos de lenguaje (IA) a
          partir de datos reales de búsqueda. Aunque procuramos que la información sea precisa, un
          modelo de IA puede cometer errores. Revisa siempre los datos importantes (fechas, precios,
          requisitos de visado) en la fuente oficial antes de tomar decisiones.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilidad del servicio">
        <p>
          Just Enjoy es un proyecto académico en desarrollo activo. No garantizamos disponibilidad
          continua ni ausencia de errores. Podemos modificar, pausar o interrumpir el servicio en
          cualquier momento.
        </p>
      </LegalSection>

      <LegalSection title="7. Cambios en estas condiciones">
        <p>
          Podemos actualizar estos términos según evolucione el proyecto. Si hacemos cambios
          relevantes, actualizaremos la fecha de &ldquo;última actualización&rdquo; al inicio de esta página.
        </p>
      </LegalSection>

      <LegalSection title="8. Ley aplicable">
        <p>Estas condiciones se rigen por la legislación española.</p>
      </LegalSection>

      <LegalSection title="9. Contacto">
        <p>
          Para cualquier duda sobre estas condiciones, escríbenos a{' '}
          <a href="mailto:soporte@justenjoy.app" className="text-brand-blue font-bold hover:underline">
            soporte@justenjoy.app
          </a>
          . Más información sobre cómo tratamos tus datos en nuestra{' '}
          <Link href="/privacy" className="text-brand-blue font-bold hover:underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
