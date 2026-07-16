import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { TripProvider } from "@/context/TripContext";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

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
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-brand-cream text-brand-dark">
        <AuthProvider>
          <TripProvider>
            <Navbar />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
          </TripProvider>
        </AuthProvider>
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
