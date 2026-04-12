const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const intelData = {
    title: "Read & Rate: Stratégie Virale Validée (Mars 2026)",
    category: "marketing-strategy",
    summary: `RAPPORT COMPLET BEACON & AURA.
1. État des lieux Reddit (r/selfpublish, r/writing) : L'approche d'anti-promotion ("roast my cover") est saturée et sévèrement modérée en 2026.
2. Opportunité BookTok (Mars 2026) : Les tendances "Judge a Book by its Cover" et "Cover Reveal" dominent l'algorithme. Les lecteurs perçoivent le livre comme objet esthétique.
3. Plan d'Action Révisé :
  - Phase A (B2C) : Créer des vidéos courtes (TikTok/Reels) montrant 2 couvertures côte-à-côte avec le hook "Lequel achèteriez-vous sans lire le résumé ?". CTA vers le sondage Read & Rate.
  - Phase B (B2B) : Prospection automatisée (via N8N) d'auteurs indés sous les hashtags #WritingCommunity/#CoverReveal. Offre : Tester leurs couvertures sur Read & Rate avant l'annonce officielle.
4. Technique (Forge) : Valider les OG Tags pour que les partages réseaux sociaux affichent bien le split d'images des sondages.`,
    importance: "hot",
    source: "Beacon (Analyse BookTok & Reddit 2026)"
  };

  const { data, error } = await supabase.from('intel').insert([intelData]);
  if (error) {
    console.error("Error inserting intel:", error);
  } else {
    console.log("Successfully inserted verified intel into Supabase.");
  }
}
run();
