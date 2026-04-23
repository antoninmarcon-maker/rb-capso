import Script from "next/script";

const schema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "RB-CapSO",
  description:
    "Location et conception de vans aménagés dans le sud des Landes, par un artisan menuisier.",
  url: "https://rb-capso.fr",
  telephone: "+33600000000",
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
  image: "https://rb-capso.fr/og-default.jpg",
  priceRange: "€€",
  sameAs: ["https://www.instagram.com/Rb.capso/"],
} as const;

export function LocalBusinessSchema() {
  return (
    <Script id="local-business-schema" type="application/ld+json">
      {JSON.stringify(schema)}
    </Script>
  );
}
