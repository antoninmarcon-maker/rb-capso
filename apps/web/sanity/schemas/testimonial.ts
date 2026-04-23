import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Témoignage",
  type: "document",
  fields: [
    defineField({ name: "author", title: "Auteur", type: "string", validation: (r) => r.required() }),
    defineField({ name: "city", title: "Ville", type: "string" }),
    defineField({ name: "quote", title: "Citation", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({
      name: "stars",
      title: "Étoiles",
      type: "number",
      validation: (r) => r.required().min(1).max(5).integer(),
    }),
    defineField({ name: "van", title: "Van concerné", type: "reference", to: [{ type: "van" }] }),
    defineField({ name: "date", title: "Date", type: "date" }),
  ],
  preview: {
    select: { title: "author", subtitle: "city", stars: "stars" },
    prepare: ({ title, subtitle, stars }) => ({
      title: `${title} (${stars}★)`,
      subtitle,
    }),
  },
});
