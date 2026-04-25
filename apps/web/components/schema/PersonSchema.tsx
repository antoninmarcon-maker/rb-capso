import { JsonLd } from "./JsonLd";
import { SITE_URL } from "@/lib/seo";

const schema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}#romain`,
  name: "Romain",
  jobTitle: "Artisan menuisier, fondateur",
  description:
    "Ex-sapeur-pompier devenu menuisier. Fonde RB-CapSO à Capbreton en 2025 pour louer et fabriquer des vans aménagés à la main.",
  worksFor: {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}#business`,
  },
  sameAs: ["https://www.instagram.com/Rb.capso/"],
  address: {
    "@type": "PostalAddress",
    streetAddress: "9 Rue du Hapchot",
    postalCode: "40130",
    addressLocality: "Capbreton",
    addressCountry: "FR",
  },
  knowsAbout: [
    "Menuiserie",
    "Aménagement de van",
    "Bois massif",
    "Cannage rotin",
    "Conception sur mesure",
  ],
} as const;

export function PersonSchema() {
  return <JsonLd data={schema} />;
}
