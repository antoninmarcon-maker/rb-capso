import { defineField, defineType } from "sanity";

export const van = defineType({
  name: "van",
  title: "Van",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Nom",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL)",
      type: "slug",
      options: { source: "name", maxLength: 64 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Accroche courte",
      type: "string",
      validation: (r) => r.required().max(120),
    }),
    defineField({
      name: "model",
      title: "Modèle (Ford Transit, Fiat Ducato, etc.)",
      type: "string",
    }),
    defineField({
      name: "dailyRateEuros",
      title: "Tarif/nuit (€)",
      type: "number",
      validation: (r) => r.required().positive().integer(),
    }),
    defineField({
      name: "depositEuros",
      title: "Caution (€)",
      type: "number",
      initialValue: 1500,
    }),
    defineField({
      name: "sleeps",
      title: "Nombre de couchages",
      type: "number",
    }),
    defineField({
      name: "lengthMeters",
      title: "Longueur (m)",
      type: "number",
    }),
    defineField({
      name: "description",
      title: "Description longue",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "storyOfUse",
      title: "Récit d'usage (« Une semaine avec… »)",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "gallery",
      title: "Galerie photos",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            { name: "alt", type: "string", title: "Alt (obligatoire)" },
          ],
        },
      ],
      validation: (r) => r.min(8).max(15),
    }),
    defineField({
      name: "features",
      title: "Équipements (icônes + labels)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "icon", type: "string", title: "Icône (lucide name)" },
            { name: "label", type: "string", title: "Label" },
          ],
        },
      ],
    }),
    defineField({
      name: "equipment",
      title: "Équipement détaillé (groupes)",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "group", type: "string", title: "Groupe (Couchage, Cuisine…)" },
            {
              name: "items",
              type: "array",
              of: [{ type: "string" }],
              title: "Items",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "rules",
      title: "Règles (animaux, km, fumeurs…)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "yescapaListingUrl",
      title: "URL annonce Yescapa",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "tagline", media: "gallery.0" },
  },
});
