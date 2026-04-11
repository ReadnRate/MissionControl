import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const [total, newLeads, contacted, invalid] = await Promise.all([
      supabase.from("trym_leads").select("id", { count: "exact", head: true }),
      supabase.from("trym_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("trym_leads").select("id", { count: "exact", head: true }).eq("status", "contacted"),
      supabase.from("trym_leads").select("id", { count: "exact", head: true }).eq("status", "invalid"),
    ]);

    const { data: byCity } = await supabase
      .from("trym_leads")
      .select("city")
      .not("city", "is", null);

    const cityCounts: Record<string, number> = {};
    (byCity || []).forEach((r: any) => {
      const c = r.city || "Unknown";
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    });

    const { data: byCountry } = await supabase
      .from("trym_leads")
      .select("country")
      .not("country", "is", null);

    const countryCounts: Record<string, number> = {};
    (byCountry || []).forEach((r: any) => {
      const c = r.country || "Unknown";
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });

    return NextResponse.json({
      total: total.count || 0,
      new: newLeads.count || 0,
      contacted: contacted.count || 0,
      invalid: invalid.count || 0,
      byCity: Object.entries(cityCounts).sort((a, b) => b[1] - a[1]),
      byCountry: Object.entries(countryCounts).sort((a, b) => b[1] - a[1]),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
