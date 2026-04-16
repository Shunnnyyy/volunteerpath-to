import { fetchCityVolunteers } from "@/lib/fetchCityVolunteers";
export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabase";
import { fetchTorontoLibraryVolunteerPage } from "@/lib/fetchVolunteers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  // 允许两种情况：
  // 1. 手动访问 /api/sync?secret=...
  // 2. Vercel cron 直接访问 /api/sync
  if (secret && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const libraryData = await fetchTorontoLibraryVolunteerPage();
    const cityData = await fetchCityVolunteers();

    const data = [...libraryData, ...cityData];

    for (const item of data) {
      const slug = item.title.toLowerCase().replace(/\s+/g, "-");

      await supabaseAdmin
        .from("volunteer_opportunities")
        .upsert(
          {
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
            source_name: "toronto_public_library",
            is_active: true,
            last_checked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "sync failed" }, { status: 500 });
  }
}