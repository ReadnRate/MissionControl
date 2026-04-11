import { createClient } from "@supabase/supabase-js";
import TrymLeadsClient from "./TrymLeadsClient";

// Force dynamic rendering — data must always be fresh from the server
export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  created_at: string;
  logo_url: string | null;
  hero_image_url: string | null;
  services: string | null;
}

interface Stats {
  total: number;
  new: number;
  contacted: number;
  invalid: number;
  byCity: [string, number][];
  byCountry: [string, number][];
  error?: string;
}

// Server-side Supabase client — uses service role key so no RLS restrictions apply
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function fetchStats(): Promise<Stats> {
  const supabase = getSupabaseAdmin();

  const [total, newLeads, contacted, invalid, byCityResult, byCountryResult] =
    await Promise.all([
      supabase
        .from("trym_leads")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("trym_leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("trym_leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "contacted"),
      supabase
        .from("trym_leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "invalid"),
      supabase.from("trym_leads").select("city").not("city", "is", null),
      supabase.from("trym_leads").select("country").not("country", "is", null),
    ]);

  const countCity: Record<string, number> = {};
  (byCityResult.data ?? []).forEach((r: any) => {
    const c = r.city || "Unknown";
    countCity[c] = (countCity[c] || 0) + 1;
  });

  const countCountry: Record<string, number> = {};
  (byCountryResult.data ?? []).forEach((r: any) => {
    const c = r.country || "Unknown";
    countCountry[c] = (countCountry[c] || 0) + 1;
  });

  return {
    total: total.count ?? 0,
    new: newLeads.count ?? 0,
    contacted: contacted.count ?? 0,
    invalid: invalid.count ?? 0,
    byCity: Object.entries(countCity).sort((a, b) => b[1] - a[1]),
    byCountry: Object.entries(countCountry).sort((a, b) => b[1] - a[1]),
  };
}

async function fetchLeads(): Promise<Lead[]> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("trym_leads")
    .select("id,business_name,email,phone,website,city,country,status,created_at,logo_url,hero_image_url,services")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data as Lead[]) ?? [];
}

export default async function TrymLeadsPage() {
  // Fetch stats and leads in parallel on the server
  const [initialStats, initialLeads] = await Promise.all([
    fetchStats(),
    fetchLeads(),
  ]);

  return (
    <TrymLeadsClient initialLeads={initialLeads} initialStats={initialStats} />
  );
}
