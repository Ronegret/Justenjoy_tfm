import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Política de Privacidad — Just Enjoy',
  description: 'Qué datos recoge Just Enjoy, para qué los usa y con quién los comparte.',
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      icon={ShieldCheck}
      eyebrow="Privacidad"
      title="Política de Privacidad"
      lastUpdated="18 de julio de 2026"
      intro="Explicamos aquí, en lenguaje claro, qué datos recogemos, para qué los usamos y con qué proveedores los compartimos para poder generar tu plan de viaje."
    >
      <LegalSection title="1. Quiénes somos">
        <p>
          Just Enjoy es un proyecto académico desarrollado como Trabajo Final de Máster (TFM) en
          EBIS Business Techschool. No es un servicio comercial en producción: es un prototipo
          funcional construido con fines educativos, aunque procesa datos reales de quien lo usa
          igual que lo haría cualquier producto real.
        </p>
        <p>
          Para cualquier duda o para ejercer tus derechos sobre tus datos, puedes escribirnos a{' '}
          <a href="mailto:soporte@justenjoy.app" className="text-brand-blue font-bold hover:underline">
            soporte@justenjoy.app
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos recogemos">
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>
            <strong className="text-brand-dark">Datos de cuenta:</strong> nombre y correo electrónico,
            al registrarte con email/contraseña o con tu cuenta de Google (gestionado por Firebase
            Authentication). No almacenamos tu contraseña — la gestiona Firebase de forma cifrada.
          </li>
          <li>
            <strong className="text-brand-dark">Preferencias de viaje:</strong> origen, destino,
            fechas, presupuesto, número de viajeros, intereses y restricciones que escribes en el
            planificador. Se usan para generar tu plan y se envían a los proveedores listados en la
            sección 4.
          </li>
          <li>
            <strong className="text-brand-dark">Planes generados:</strong> el itinerario, vuelos,
            hotel y actividades que te proponemos se guardan para que puedas volver a consultarlos.
            No van vinculados directamente a tu nombre o email en la base de datos que los almacena.
          </li>
          <li>
            <strong className="text-brand-dark">Cookie de sesión:</strong> una cookie técnica
            (<code className="text-xs bg-brand-cream/60 px-1.5 py-0.5 rounded">justenjoy-session</code>)
            que nos permite recordar que has iniciado sesión. Más detalle en nuestra{' '}
            <Link href="/cookies" className="text-brand-blue font-bold hover:underline">
              Política de Cookies
            </Link>
            .
          </li>
          <li>
            <strong className="text-brand-dark">Almacenamiento local del navegador:</strong> una copia
            de tus viajes guardados en tu propio dispositivo (localStorage), para que la app cargue
            más rápido. Nunca sale de tu navegador salvo cuando decides compartir un viaje.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para qué usamos tus datos">
        <p>
          Usamos tus datos únicamente para generar tu plan de viaje, mantener tu sesión iniciada y
          permitirte guardar y consultar tus viajes. No usamos tus datos para publicidad, no
          hacemos perfilado comercial y no los vendemos ni cedemos a terceros con fines de
          marketing.
        </p>
      </LegalSection>

      <LegalSection title="4. Con quién compartimos datos">
        <p>
          Para construir tu plan, tus preferencias de viaje se envían a los siguientes proveedores,
          cada uno como encargado del tratamiento de esa parte concreta del proceso:
        </p>
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li><strong className="text-brand-dark">Firebase (Google):</strong> gestión de tu cuenta y sesión.</li>
          <li><strong className="text-brand-dark">Supabase:</strong> almacenamiento de los planes de viaje generados.</li>
          <li><strong className="text-brand-dark">OpenAI y Anthropic:</strong> generación del contenido del plan mediante modelos de lenguaje (IA).</li>
          <li><strong className="text-brand-dark">SerpAPI:</strong> búsqueda de vuelos, hoteles y actividades reales (vía Google Flights, Hotels y Maps).</li>
          <li><strong className="text-brand-dark">Google Maps Platform:</strong> mapas, geocodificación y fotos de lugares.</li>
          <li><strong className="text-brand-dark">Tavily:</strong> búsqueda de información sobre visados, clima y transporte del destino.</li>
          <li><strong className="text-brand-dark">Open-Meteo y OpenStreetMap (Nominatim):</strong> datos climáticos y de geolocalización, ambos servicios públicos y gratuitos.</li>
        </ul>
        <p>
          Ninguno de estos proveedores recibe más datos de los estrictamente necesarios para
          realizar su parte del proceso (por ejemplo, SerpAPI recibe fechas y ciudades, no tu email).
        </p>
      </LegalSection>

      <LegalSection title="5. Cuánto tiempo conservamos tus datos">
        <p>
          Tu cuenta y tus planes de viaje se conservan mientras mantengas tu cuenta activa. Puedes
          pedirnos la eliminación de tu cuenta y de los planes asociados escribiendo a{' '}
          <a href="mailto:soporte@justenjoy.app" className="text-brand-blue font-bold hover:underline">
            soporte@justenjoy.app
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Tus derechos">
        <p>
          Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos o eliminarlos. Al
          ser un proyecto académico no contamos con un Delegado de Protección de Datos formal, pero
          atendemos estas solicitudes por correo lo antes posible.
        </p>
      </LegalSection>

      <LegalSection title="7. Seguridad">
        <p>
          Tu sesión se verifica en el servidor mediante cookies firmadas y de solo lectura desde el
          navegador (httpOnly). Las claves de acceso a nuestros proveedores nunca se exponen en el
          código del navegador salvo las que son públicas por diseño (como la configuración de
          Firebase, que identifica el proyecto pero no da acceso a datos). Ningún sistema es
          perfecto: si detectas un problema de seguridad, agradecemos que nos escribas.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
