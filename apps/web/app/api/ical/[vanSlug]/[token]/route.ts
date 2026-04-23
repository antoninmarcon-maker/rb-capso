import { NextRequest } from "next/server";
import { generateICalForVan } from "@/lib/ical/generator";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";
export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vanSlug: string; token: string }> }
) {
  const { vanSlug, token } = await params;

  const supabase = createAdminClient();

  const { data: van } = await supabase
    .from("vans")
    .select("id, name, ical_export_token")
    .eq("slug", vanSlug)
    .single();

  if (!van || van.ical_export_token !== token) {
    return new Response("Not found", { status: 404 });
  }

  const { data: blocks } = await supabase
    .from("availability_blocks")
    .select("id, start_date, end_date")
    .eq("van_id", van.id)
    .in("source", ["direct", "manual"]);

  const ics = generateICalForVan(
    van.name,
    (blocks ?? []).map((b) => ({
      id: b.id,
      vanName: van.name,
      startDate: new Date(b.start_date),
      endDate: new Date(b.end_date),
    }))
  );

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${vanSlug}.ics"`,
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
