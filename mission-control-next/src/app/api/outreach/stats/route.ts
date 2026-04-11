import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const [totalSent, bouncedFailed, totalLeads, sentRows] = await Promise.all([
      supabase
        .from("outreach_log")
        .select("id", { count: "exact", head: true })
        .eq("status", "sent"),
      supabase
        .from("outreach_log")
        .select("id", { count: "exact", head: true })
        .in("status", ["bounced", "failed"]),
      supabase
        .from("author_leads")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("outreach_log")
        .select("email_sent_to"),
    ]);

    const sentSet = new Set((sentRows.data || []).map((r: any) => r.email_sent_to));

    const { data: newLeads } = await supabase
      .from("author_leads")
      .select("email")
      .eq("status", "new");

    const availableToSend = (newLeads || []).filter((l: any) => !sentSet.has(l.email)).length;

    return NextResponse.json({
      totalSent: totalSent.count ?? 0,
      bouncedFailed: bouncedFailed.count ?? 0,
      totalLeads: totalLeads.count ?? 0,
      availableToSend,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
