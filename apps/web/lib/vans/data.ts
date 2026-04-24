/**
 * Source of truth for van data (fallback if Sanity is empty).
 * Update env vars NEXT_PUBLIC_YESCAPA_URL_PENELOPE and NEXT_PUBLIC_YESCAPA_URL_PEGGY
 * with the real Yescapa listing URLs before going to production.
 */

export type VanSlug = "penelope" | "peggy";

export interface VanData {
  slug: VanSlug;
  name: string;
  model: string;
  tagline: string;
  priceFromEuros: number;
  sleeps: number;
  length: string;
  yescapaUrl: string;
  gallery: readonly string[];
  story: string;
  features: ReadonlyArray<{ label: string }>;
  equipment: ReadonlyArray<{ group: string; items: readonly string[] }>;
  rules: readonly string[];
}

const YESCAPA_PENELOPE =
  process.env.NEXT_PUBLIC_YESCAPA_URL_PENELOPE ?? "https://www.yescapa.fr/search?q=RB-CapSO";
const YESCAPA_PEGGY =
  process.env.NEXT_PUBLIC_YESCAPA_URL_PEGGY ?? "https://www.yescapa.fr/search?q=RB-CapSO";

export const vans: Record<VanSlug, VanData> = {
  penelope: {
    slug: "penelope",
    name: "Pénélope",
    model: "Ford Transit Custom",
    tagline:
      "Compact, avec tente de toit. Pour les duos qui dorment haut et bougent léger.",
    priceFromEuros: 90,
    sleeps: 4,
    length: "5,34 m",
    yescapaUrl: YESCAPA_PENELOPE,
    gallery: [
      "/van-penelope.jpg",
      "/van-penelope-2.jpg",
      "/van-penelope-3.jpg",
      "/van-penelope-4.jpg",
    ],
    story:
      "Une semaine avec Pénélope commence souvent par une vraie petite route. Vous ouvrez la porte latérale un vendredi soir à Capbreton. La tente de toit se déplie en trente secondes, le café tient sur le réchaud plug pendant que les planches descendent du porte-surf. Ce van n'est pas lourd, il ne s'encombre pas, il se faufile.",
    features: [
      { label: "4 couchages" },
      { label: "Permis B" },
      { label: "Tente de toit" },
      { label: "Porte-planches" },
      { label: "Douche ext." },
      { label: "Frigo compressor" },
    ],
    equipment: [
      {
        group: "Couchage",
        items: [
          "Tente de toit 2 places (ouverture 30s)",
          "Banquette convertible 2 places bas",
          "Oreillers et couette fournis",
        ],
      },
      {
        group: "Cuisine",
        items: [
          "Réchaud 2 feux plug",
          "Frigo compressor 40L",
          "Vaisselle pour 4",
          "Bouteille de gaz",
        ],
      },
      {
        group: "Extérieur",
        items: ["Porte-planches surf", "Douche extérieure", "Auvent rétractable"],
      },
    ],
    rules: [
      "Caution : 1 500 €",
      "Kilométrage inclus : 200 km/jour",
      "Animaux : oui (+40 € nettoyage)",
      "Fumeurs : non",
      "Départ et retour : à Capbreton",
    ],
  },
  peggy: {
    slug: "peggy",
    name: "Peggy",
    model: "Fiat Ducato L2H2",
    tagline:
      "Grand volume, couchage surélevé, dinette sauge. Pour deux à quatre, longues étapes et routes lentes.",
    priceFromEuros: 130,
    sleeps: 4,
    length: "5,99 m",
    yescapaUrl: YESCAPA_PEGGY,
    gallery: [
      "/van-peggy.jpg",
      "/van-peggy-2.jpg",
      "/van-peggy-3.jpg",
      "/van-peggy-4.jpg",
    ],
    story:
      "Quand vous ouvrez la porte latérale de Peggy, vous sentez d'abord le bois clair chauffé par la journée. Puis l'odeur tiède du cannage. Le plan de travail en frêne massif a déjà des traces de couteau, et c'est très bien comme ça. Peggy est taillé pour les étapes longues. On tient à quatre sans se marcher dessus, on cuisine sans jouer au Tetris, et la hauteur intérieure permet d'enfiler un pantalon debout.",
    features: [
      { label: "4 couchages" },
      { label: "Permis B" },
      { label: "Couchage surélevé" },
      { label: "Dinette sauge" },
      { label: "Douche int." },
      { label: "Solaire 200W" },
    ],
    equipment: [
      {
        group: "Couchage",
        items: [
          "Lit surélevé permanent 140x190",
          "Dinette convertible 2 places",
          "Literie complète fournie",
        ],
      },
      {
        group: "Cuisine",
        items: [
          "Réchaud 2 feux intégré",
          "Frigo compressor 90L",
          "Évier inox + robinet",
          "Plan de travail bois massif",
          "Four mini 15L",
        ],
      },
      {
        group: "Salle d'eau",
        items: ["Douche intérieure", "WC cassette", "Réservoirs eaux propres + usées"],
      },
      {
        group: "Autonomie",
        items: [
          "Panneau solaire 200W",
          "Batterie cellule 200Ah",
          "Convertisseur 2000W",
          "Chauffage gaz",
        ],
      },
    ],
    rules: [
      "Caution : 1 500 €",
      "Kilométrage inclus : 200 km/jour",
      "Animaux : oui (+40 € nettoyage)",
      "Fumeurs : non",
      "Départ et retour : à Capbreton",
    ],
  },
};
