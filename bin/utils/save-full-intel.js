const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const content = `
# Rapport d'Analyse : Stratégie Virale Read & Rate (Objectif 500 Subs)

## 1. État des Lieux et Analyse des Tendances (Mars 2026)
Suite à la fermeture de la bêta publique de Digg, notre stratégie d'acquisition organique doit pivoter vers les plateformes où l'engagement autour de l'esthétique du livre est le plus fort.

**Recherche Reddit (r/selfpublish, r/writing) :**
- Les tactiques d'anti-promotion directes (du type "roast my cover") montrent des signes de saturation en ce début 2026. Les modérateurs sont devenus très stricts.
- *Conclusion :* Reddit sera utilisé pour l'engagement communautaire authentique, mais n'est plus le vecteur de viralité n°1.

**Recherche TikTok (BookTok 2026) :**
- Les tendances "Judge a Book by its Cover" et "Cover Reveal" dominent l'algorithme en mars 2026.
- Les lecteurs achètent de plus en plus de livres comme objets esthétiques. Le format vidéo de "Cover Reveal" est devenu le pilier du marketing pour les auteurs indépendants.

## 2. Le Plan d'Action Révisé (Zéro Digg)

**Phase A : L'effet "Judge A Book" (TikTok / Reels)**
- **Concept :** Vidéos courtes (< 10s) montrant deux couvertures de livres auto-publiés côte à côte.
- **Hook :** "Lequel achèteriez-vous sans lire le résumé ? Soyez honnête."
- **Call-To-Action :** "Votez pour la meilleure couverture sur Read & Rate (lien en bio)."

**Phase B : Le Service "Cover Reveal" (B2B Indie Authors)**
- **Concept :** Contacter les auteurs sur le point de sortir un livre. 
- **Offre :** Tester leurs concepts de couvertures sur Read & Rate auprès de vrais lecteurs avant leur annonce officielle.
- **Viralité :** Les auteurs partageront leur lien de sondage Read & Rate à leur audience.

## 3. Prochaines Étapes Techniques (Pour Forge)
- Vérifier que les liens de partage (OG Tags) des sondages affichent correctement les deux couvertures.
- Mettre en place N8N pour scraper TikTok/Instagram via les hashtags #WritingCommunity et #CoverReveal.
`;

  const { error } = await supabase.from('intel').insert([{
    title: 'Rapport Complet : Stratégie Virale Read & Rate (Mars 2026)', 
    category: 'marketing-strategy', 
    summary: content, 
    importance: 'hot', 
    source: 'Aura/Beacon Analysis'
  }]);
  
  if (error) console.error(error);
  else console.log("Full report saved to Supabase Intel.");
}
run();
