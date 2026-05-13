export const runtime = "nodejs";

import { scrapeVolunteerOpportunities } from "@/lib/scrapeOpportunities";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const manualSecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const isLocalDev = process.env.NODE_ENV !== "production";

  if (!isLocalDev) {
    if (!cronSecret) {
      return Response.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
    }

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || manualSecret === cronSecret;

    if (!isAuthorized) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const startedAt = new Date().toISOString();
    const supabaseAdmin = getSupabaseAdmin();
    const { opportunities, errors } = await scrapeVolunteerOpportunities();

    const rows = opportunities.map((item) => {
      const slug = slugify(`${item.organization}-${item.title}`);

      return {
        slug,
        title: item.title,
        organization: item.organization,
        duration: item.duration,
        introduction: item.introduction,
        summary: item.summary,
        best_for: item.bestFor ?? [],
        requirements: item.requirements ?? [],
        languages: item.languages ?? [],
        link: item.link,
        source_type: "scraped",
        source_name: item.sourceName,
        is_active: true,
        last_checked_at: startedAt,
        updated_at: startedAt,
      };
    });

    const { error: upsertError } = await supabaseAdmin
      .from("volunteer_opportunities")
      .upsert(rows, { onConflict: "slug" });

    if (upsertError) {
      throw upsertError;
    }

    if (rows.length > 0) {
      const activeSlugSet = new Set(rows.map((row) => row.slug));
      const { data: existingRows, error: existingRowsError } = await supabaseAdmin
        .from("volunteer_opportunities")
        .select("slug")
        .eq("source_type", "scraped")
        .eq("is_active", true);

      if (existingRowsError) {
        throw existingRowsError;
      }

      const staleSlugs =
        existingRows?.map((row) => row.slug).filter((slug) => !activeSlugSet.has(slug)) ?? [];

      if (staleSlugs.length === 0) {
        return Response.json({
          success: true,
          checkedAt: startedAt,
          upserted: rows.length,
          deactivated: 0,
          warnings: errors,
        });
      }

      const { error: deactivateError } = await supabaseAdmin
        .from("volunteer_opportunities")
        .update({
          is_active: false,
          last_checked_at: startedAt,
          updated_at: startedAt,
        })
        .in("slug", staleSlugs);

      if (deactivateError) {
        throw deactivateError;
      }

      return Response.json({
        success: true,
        checkedAt: startedAt,
        upserted: rows.length,
        deactivated: staleSlugs.length,
        warnings: errors,
      });
    }

    return Response.json({
      success: true,
      checkedAt: startedAt,
      upserted: rows.length,
      deactivated: 0,
      warnings: errors,
    });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "sync failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}
