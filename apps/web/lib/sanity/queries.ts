import { groq } from "next-sanity";

export const vanBySlugQuery = groq`
  *[_type == "van" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    tagline,
    model,
    dailyRateEuros,
    depositEuros,
    sleeps,
    lengthMeters,
    description,
    storyOfUse,
    gallery[]{
      _key,
      asset,
      alt
    },
    features,
    equipment,
    rules,
    yescapaListingUrl
  }
`;

export const allVansQuery = groq`
  *[_type == "van"] | order(dailyRateEuros asc){
    _id,
    name,
    "slug": slug.current,
    tagline,
    dailyRateEuros,
    "coverImage": gallery[0]
  }
`;

export const latestArticlesQuery = groq`
  *[_type == "article"] | order(publishedAt desc)[0..$limit]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    cover,
    publishedAt
  }
`;

export const testimonialsQuery = groq`
  *[_type == "testimonial"] | order(date desc)[0..$limit]{
    _id,
    author,
    city,
    quote,
    stars,
    date,
    "vanName": van->name
  }
`;
