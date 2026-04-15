export const runtime = "nodejs";

import { majorTracks } from "@/data/volunteers";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("volunteer_opportunities")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);

    return Response.json(
      {
        lastUpdated: new Date().toISOString().split("T")[0],
        source: "database error",
        opportunities: [],
        majorTracks,
      },
      { status: 500 }
    );
  }

  const lastUpdated =
    data && data.length > 0
      ? new Date(data[0].updated_at).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

  return Response.json({
    lastUpdated,
    source: "database",
    opportunities: data ?? [],
    majorTracks,
  });
}