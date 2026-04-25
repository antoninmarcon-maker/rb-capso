import { createElement } from "react";

// Server-rendered JSON-LD: native <script type="application/ld+json"> with
// JSON content inlined into the HTML (NOT into the React Server Component
// payload as next/script does). createElement avoids the JSX child-escaping
// edge case for application/ld+json (React passes the JSON string verbatim
// into innerHTML, which is what Google/Bing/LinkedIn crawlers expect).
type Props = { data: Record<string, unknown> | unknown };

export function JsonLd({ data }: Props) {
  return createElement("script", {
    type: "application/ld+json",
    suppressHydrationWarning: true,
    children: JSON.stringify(data),
  });
}
