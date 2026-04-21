export const runtime = "nodejs";

import { supabaseAdmin } from "@/lib/supabase";

// 👉 获取浏览数
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("site_stats")
      .select("value")
      .eq("key", "homepage_views")
      .single();

    if (error) {
      console.error(error);
      return Response.json({ views: 0 }, { status: 500 });
    }

    return Response.json({ views: data?.value ?? 0 });
  } catch (err) {
    console.error(err);
    return Response.json({ views: 0 }, { status: 500 });
  }
}

// 👉 每访问一次 +1
export async function POST() {
  try {
    const { data: currentRow, error: readError } = await supabaseAdmin
      .from("site_stats")
      .select("value")
      .eq("key", "homepage_views")
      .single();

    if (readError) {
      console.error(readError);
      return Response.json({ success: false }, { status: 500 });
    }

    const nextValue = (currentRow?.value ?? 0) + 1;

    const { error: updateError } = await supabaseAdmin
      .from("site_stats")
      .update({
        value: nextValue,
        updated_at: new Date().toISOString(),
      })
      .eq("key", "homepage_views");

    if (updateError) {
      console.error(updateError);
      return Response.json({ success: false }, { status: 500 });
    }

    return Response.json({ success: true, views: nextValue });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false }, { status: 500 });
  }
}