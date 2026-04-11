"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function deleteTrymLeads(ids: string[]): Promise<{ success: boolean; deleted: number; error?: string }> {
  if (!ids || ids.length === 0) {
    return { success: false, deleted: 0, error: "No IDs provided" };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("trym_leads")
    .delete()
    .in("id", ids);

  if (error) {
    return { success: false, deleted: 0, error: error.message };
  }

  revalidatePath("/trym-leads");
  return { success: true, deleted: ids.length };
}
