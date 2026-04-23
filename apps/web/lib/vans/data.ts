/**
 * Source of truth for van data (fallback if Sanity is empty).
 * Update env vars NEXT_PUBLIC_YESCAPA_URL_MARCEAU and NEXT_PUBLIC_YESCAPA_URL_LAZARE
 * with the real Yescapa listing URLs before going to production.
 */

export type VanSlug = "marceau" | "lazare";

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

const YESCAPA_MARCEAU =
  process.env.NEXT_PUBLIC_YESCAPA_URL_MARCEAU ?? "https://www.yescapa.fr/search?q=RB-CapSO";
const YESCAPA_LAZARE =
  process.env.NEXT_PUBLIC_YESCAPA_URL_LAZARE ?? "https://www.yescapa.fr/search?q=RB-CapSO";

export const vans: Record<VanSlug, VanData> = {
  marceau: {
    slug: "marceau",
    name: "Marceau",
    model: "Ford Transit Custom",
    tagline:
      "Compact, avec tente de toit. Pour les duos qui dorment haut et bougent léger.",
    priceFromEuros: 90,
    sleeps: 4,
    length: "5,34 m",
    yescapaUrl: YESCAPA_MARCEAU,
    gallery: [
      "/van-marceau.jpg",
      "/van-marceau-2.jpg",
      "/van-marceau-3.jpg",
      "/van-marceau-4.jpg",
    ],
    story:
      "Une semaine avec Marceau commence souvent par une vraie petite route. Vous ouvrez la porte latérale un vendredi soir à Capbreton. La tente de toit se déplie en trente secondes, le café tient sur le réchaud plug pendant que les planches descendent du porte-surf. Ce van n'est pas lourd, il ne s'encombre pas, il se faufile.",
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
  lazare: {
    slug: "lazare",
    name: "Lazare",
    model: "Fiat Ducato L2H2",
    tagline:
      "Grand volume, couchage surélevé, dinette sauge. Pour deux à quatre, longues étapes et routes lentes.",
    priceFromEuros: 130,
    sleeps: 4,
    length: "5,99 m",
    yescapaUrl: YESCAPA_LAZARE,
    gallery: [
      "/van-lazare.jpg",
      "/van-lazare-2.jpg",
      "/van-lazare-3.jpg",
      "/van-lazare-4.jpg",
    ],
    story:
      "Quand vous ouvrez la porte latérale de Lazare, vous sentez d'abord le bois clair chauffé par la journée. Puis l'odeur tiède du cannage. Le plan de travail en frêne massif a déjà des traces de couteau, et c'est très bien comme ça. Lazare est taillé pour les étapes longues. On tient à quatre sans se marcher dessus, on cuisine sans jouer au Tetris, et la hauteur intérieure permet d'enfiler un pantalon debout.",
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
