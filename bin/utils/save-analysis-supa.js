const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const content = `Suite à notre recherche actualisée (Mars 2026), voici la stratégie virale ajustée pour atteindre les 500 abonnés sur Read & Rate, en tenant compte de la mort de Digg et des réalités des plateformes :

1. L'illusion Reddit : L'approche "Roast my cover" est saturée sur r/selfpublish et r/writing. Les modérateurs bloquent l'autopromotion déguisée. Reddit doit rester un outil d'engagement pur, pas notre canal d'acquisition principal.

2. La mine d'or BookTok (TikTok 2026) : Les tendances "Judge a Book by its Cover" et "Cover Reveal" dominent l'algorithme. Les lecteurs jugent et achètent les livres pour leur esthétique.

Plan d'Action Révisé :
- Phase A (TikTok "Judge A Book") : Créer des vidéos ultra-courtes (<10s) confrontant deux couvertures. Hook : "Lequel achèteriez-vous sans lire le résumé ?". CTA vers Read & Rate.
- Phase B (B2B Indie Authors "Cover Reveal") : Démarcher les auteurs indépendants avant leur sortie. Leur proposer de tester 2 concepts de couverture sur Read & Rate auprès de vrais lecteurs. Ils partageront eux-mêmes le lien du sondage à leur communauté, générant du trafic qualifié gratuit.

Prochaines actions techniques (pour Forge) :
- S'assurer que les OG Tags de Read & Rate affichent bien les images des couvertures lors du partage.
- Créer un workflow N8N pour scraper les auteurs utilisant #CoverReveal sur Instagram/TikTok.`;

  const { data, error } = await supabase.from('intel').insert([{
    title: 'Analyse Complète : Campagne Virale Read & Rate (Zéro Digg)', 
    category: 'marketing-strategy', 
    summary: content, 
    importance: 'high', 
    source: 'Joe/Beacon/Aura'
  }]);
  
  if (error) console.error(error);
  else console.log("Inserted analysis successfully");
}
run();
