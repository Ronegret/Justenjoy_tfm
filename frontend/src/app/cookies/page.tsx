import { Cookie } from 'lucide-react';
import LegalPageLayout, { LegalSection } from '@/components/legal/LegalPageLayout';

export const metadata = {
  title: 'Política de Cookies — Just Enjoy',
  description: 'Qué cookies usa Just Enjoy y para qué sirve cada una.',
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      icon={Cookie}
      eyebrow="Cookies"
      title="Política de Cookies"
      lastUpdated="18 de julio de 2026"
      intro="Just Enjoy usa el mínimo posible: una sola cookie, estrictamente necesaria para que puedas iniciar sesión. Nada de publicidad ni rastreo."
    >
      <LegalSection title="1. Qué cookies usamos">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-brand-dark/10">
                <th className="py-2 pr-4 font-black text-brand-dark uppercase text-xs">Nombre</th>
                <th className="py-2 pr-4 font-black text-brand-dark uppercase text-xs">Tipo</th>
                <th className="py-2 font-black text-brand-dark uppercase text-xs">Para qué sirve</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-brand-dark/5">
                <td className="py-3 pr-4 font-mono text-xs">justenjoy-session</td>
                <td className="py-3 pr-4">Técnica / necesaria</td>
                <td className="py-3">
                  Mantiene tu sesión iniciada durante 14 días. Es <code className="text-xs bg-brand-cream/60 px-1.5 py-0.5 rounded">httpOnly</code> —
                  no la puede leer ningún script del navegador, solo nuestro servidor la usa para
                  verificar que sigues conectado.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Al ser una cookie estrictamente necesaria para el funcionamiento del servicio (no puedes
          iniciar sesión sin ella), no requiere tu consentimiento previo según la normativa de
          cookies — pero preferimos contártelo igualmente.
        </p>
      </LegalSection>

      <LegalSection title="2. Almacenamiento local (no es una cookie, pero es parecido)">
        <p>
          Además de la cookie de sesión, guardamos en el <strong className="text-brand-dark">localStorage
          de tu navegador</strong> una copia de tus viajes guardados, para que la app cargue más
          rápido sin tener que pedirlos de nuevo al servidor cada vez. Esta información nunca sale de
          tu dispositivo salvo cuando tú decides compartir un viaje.
        </p>
      </LegalSection>

      <LegalSection title="3. Lo que NO usamos">
        <ul className="list-disc pl-5 flex flex-col gap-2">
          <li>Sin cookies de publicidad ni de terceros.</li>
          <li>Sin Google Analytics ni ningún otro pixel de seguimiento.</li>
          <li>Sin perfilado ni venta de datos de navegación.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cómo eliminar la cookie de sesión">
        <p>
          Cerrar sesión desde tu cuenta elimina la cookie automáticamente. También puedes borrarla en
          cualquier momento desde la configuración de cookies de tu navegador — al hacerlo, se
          cerrará tu sesión.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
