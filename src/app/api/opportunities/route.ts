export const runtime = "nodejs";

import { majorTracks } from "@/data/volunteers";
import { opportunities } from "@/data/volunteers";
import { getSupabaseAdmin } from "@/lib/supabase";

type OpportunityRow = {
  updated_at: string;
};

export async function GET() {
  let data: OpportunityRow[] | null = null;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const result = await supabaseAdmin
      .from("volunteer_opportunities")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .returns<OpportunityRow[]>();

    if (result.error) {
      throw result.error;
    }

    data = result.data;
  } catch (error) {
    console.error(error);

    const today = new Date().toISOString().split("T")[0];

    return Response.json(
      {
        lastUpdated: today,
        source: "local fallback",
        opportunities: opportunities.map((item) => ({
          ...item,
          slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
          source_type: "fallback",
          source_name: "local",
          is_active: true,
          updated_at: new Date().toISOString(),
        })),
        majorTracks,
      },
      { status: 200 }
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
