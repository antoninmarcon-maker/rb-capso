import { NextRequest } from "next/server";
import { fetchYescapaEvents } from "@/lib/ical/parser";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const VAN_SOURCES = [
  { slug: "penelope", url: process.env.YESCAPA_ICAL_VAN_PENELOPE },
  { slug: "peggy", url: process.env.YESCAPA_ICAL_VAN_PEGGY },
] as const;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const results: Array<{ vanSlug: string; success: boolean; count: number; error?: string }> = [];

  for (const source of VAN_SOURCES) {
    if (!source.url) {
      results.push({ vanSlug: source.slug, success: false, count: 0, error: "Missing URL" });
      continue;
    }

    try {
      const { data: van } = await supabase
        .from("vans")
        .select("id")
        .eq("slug", source.slug)
        .single();

      if (!van) throw new Error("Van not found");

      const events = await fetchYescapaEvents(source.url);

      // Remove old yescapa blocks, insert fresh
      await supabase.from("availability_blocks").delete().eq("van_id", van.id).eq("source", "yescapa");

      if (events.length > 0) {
        await supabase.from("availability_blocks").insert(
          events.map((e) => ({
            van_id: van.id,
            start_date: e.startDate.toISOString().split("T")[0],
            end_date: e.endDate.toISOString().split("T")[0],
            source: "yescapa",
            external_uid: e.uid,
          }))
        );
      }

      await supabase.from("ical_sync_log").insert({
        van_id: van.id,
        source_url: source.url,
        success: true,
        events_count: events.length,
      });

      results.push({ vanSlug: source.slug, success: true, count: events.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({ vanSlug: source.slug, success: false, count: 0, error: msg });
    }
  }

  return Response.json({ syncedAt: new Date().toISOString(), results });
}
