import "../globals.css";

import type { Metadata } from "next";
import { Inter, Patrick_Hand } from "next/font/google";

import { Footer } from "@/components/footer";
import { detectLanguage } from "@/app/i18n/server";
import { I18nProvider } from "@/app/i18n/i18n-context";

const inter = Inter({ subsets: ["latin"] });
const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  variable: "--font-patrick-hand",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Neige.app | Déneigement intelligent à Montréal",
  description:
    "Neige.app est une plateforme intelligente de déneigement à Montréal. Suivi des opérations, alertes neige, état des rues et informations en temps réel pour citoyens et entreprises.",
  applicationName: "Neige.app",
  keywords: [
    "déneigement",
    "neige",
    "Montréal",
    "déneigement Montréal",
    "état des rues",
    "alertes neige",
    "hiver Québec",
    "neige.app",
  ],
  authors: [{ name: "Neige.app" }],
  creator: "Neige.app",
  publisher: "Neige.app",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#111827" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],

  metadataBase: new URL("https://neige.app"),

  openGraph: {
    title: "Neige.app | Suivi du déneigement à Montréal",
    description:
      "Suivez le déneigement à Montréal : opérations en cours, alertes neige et état des rues en temps réel avec Neige.app.",
    url: "https://neige.app",
    siteName: "Neige.app",
    locale: "fr_CA",
    type: "website",
    images: [
      {
        url: "https://neige.app/og/neige-app-og.png",
        width: 1200,
        height: 630,
        alt: "Neige.app – Déneigement intelligent à Montréal",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Neige.app | Déneigement à Montréal",
    description:
      "Alertes neige, suivi du déneigement et état des rues à Montréal. Simple, clair et en temps réel.",
    images: ["https://neige.app/og/neige-app-og.png"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lng = await detectLanguage();

  return (
    <html lang={lng}>
      <body className={`${inter.className} ${patrickHand.variable}`}>
        <I18nProvider language={lng}>
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
