const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const intelData = {
    title: "Kindlepreneur Email Intel: Publisher Rocket Promo & Keyword Strategy",
    category: "content-idea",
    summary: `Source: Dave at Kindlepreneur (forwarded by manu@readnrate.com) on Mar 19, 2026.
    
Dave Chesson is promoting his tool, "Publisher Rocket", which helps authors find the right Amazon keywords and categories to rank their books better. 
Key insight: Amazon's algorithm heavily punishes "guessing" keywords and categories. Choosing the wrong ones leads to showing the book to the wrong readers or not at all.
Features highlighted: Reverse ASIN (seeing what keywords successful competitors rank for).
Offer: $60 off and a free "Keywords & Categories" course (expires March 22nd).

Actionable for Read & Rate: This is great intel for TASK-016 to generate high-quality, SEO-optimized blog posts about keyword research, book visibility, and category selection.`,
    importance: "medium",
    source: "Email (Dave at Kindlepreneur)"
  };

  const { data, error } = await supabase.from('intel').insert([intelData]);
  if (error) {
    console.error("Error inserting intel:", error);
  } else {
    console.log("Successfully inserted Kindlepreneur email intel into Supabase.");
  }
}
run();