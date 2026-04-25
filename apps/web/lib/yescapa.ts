// Yescapa outbound tracking — appends UTM parameters so a booking that
// originates from rb-capso.fr is attributable when it lands on Yescapa.
// Without this, Yescapa-driven sales look organic and we cannot prove
// the site's contribution to revenue.
export function withYescapaUtm(url: string, vanSlug: string, locale = "fr"): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "rb-capso");
    u.searchParams.set("utm_medium", "referral");
    u.searchParams.set("utm_campaign", `van_${vanSlug}`);
    u.searchParams.set("utm_content", locale);
    return u.toString();
  } catch {
    return url;
  }
}
