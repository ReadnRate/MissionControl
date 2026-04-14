import { createClient } from "@supabase/supabase-js";
import YouTubeAnalyzerClient from "./YouTubeAnalyzerClient";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchAnalyses() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("video_analyses")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function YouTubeAnalyzerPage() {
  const initialAnalyses = await fetchAnalyses();
  return <YouTubeAnalyzerClient initialAnalyses={initialAnalyses} />;
}
