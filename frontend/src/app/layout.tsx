import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TripProvider } from "@/context/TripContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

// Script anti-flash (FOUC): se ejecuta de forma síncrona antes del primer
// pintado y fija la clase `.dark` en <html> según la preferencia guardada o, si
// no hay, según el sistema. Debe ir inline y antes del contenido para que no
// haya parpadeo claro→oscuro al recargar. La <html> lleva suppressHydrationWarning
// porque este script muta su className fuera de React.
const themeInitScript = `
(function() {
  try {
    var t = localStorage.getItem('justenjoy-theme');
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JUST ENJOY - De 20 pestañas a tu viaje perfecto en 3 minutos",
  description: "Just Enjoy compara vuelos, alojamientos, actividades y clima para darte la mejor ruta en minutos. Sin estrés, sin pestañas infinitas.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-dark dark:bg-brand-dark dark:text-brand-white">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <ThemeProvider>
          <AuthProvider>
            <TripProvider>
              <Navbar />
              <main className="flex-grow flex flex-col">{children}</main>
              <Footer />
            </TripProvider>
          </AuthProvider>
        </ThemeProvider>
        {/* Service Worker PWA Registration Script — solo en producción (en dev provoca bucles con Fast Refresh) */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(reg) {
                      console.log('PWA ServiceWorker registered successfully:', reg.scope);
                    }).catch(function(err) {
                      console.log('PWA ServiceWorker registration failed:', err);
                    });
                  });
                }
              `
            }}
          />
        )}
      </body>
    </html>
  );
}
