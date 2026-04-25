import Script from "next/script";
import { SITE_URL } from "@/lib/seo";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}#business`,
  name: "RB-CapSO",
  alternateName: "RB CapSO Atelier",
  description:
    "Location et conception de vans aménagés dans le sud des Landes, par un artisan menuisier.",
  url: SITE_URL,
  email: "bonjour@rb-capso.fr",
  address: {
    "@type": "PostalAddress",
    streetAddress: "9 Rue du Hapchot",
    postalCode: "40130",
    addressLocality: "Capbreton",
    addressRegion: "Landes",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 43.6447,
    longitude: -1.4284,
  },
  areaServed: [
    "Capbreton",
    "Hossegor",
    "Seignosse",
    "Soustons",
    "Soorts",
    "Dax",
    "Bayonne",
    "Biarritz",
    "Mont-de-Marsan",
    "Peyrehorade",
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "19:00",
    },
  ],
  image: `${SITE_URL}/api/og`,
  logo: `${SITE_URL}/icon.svg`,
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Cash, Credit Card, Bank Transfer",
  sameAs: ["https://www.instagram.com/Rb.capso/"],
} as const;

export function LocalBusinessSchema() {
  return (
    <Script id="local-business-schema" type="application/ld+json">
      {JSON.stringify(schema)}
    </Script>
  );
}
