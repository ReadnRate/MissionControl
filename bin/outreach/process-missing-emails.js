const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

const intelData = [
  {
    title: 'Idée Blog: L\'algorithme A10 d\'Amazon et les mots-clés (Dave Chesson)',
    category: 'blog-idea',
    summary: 'Analyse du courriel "The A10 update changed keyword strategy" de Dave Chesson (Kindlepreneur).\n\nSujet : La mise à jour de l\'algorithme A10 d\'Amazon change la donne pour les mots-clés.\n\nConstat : Les mots-clés larges nuisent désormais à la découvrabilité. L\'intention d\'achat et la pertinence stricte sont plus importantes que jamais. Mettre de mauvais mots-clés pour espérer gratter quelques impressions périphériques fera chuter le taux de conversion global du livre, et donc son classement général.\n\nIdées de contenu pour Read & Rate :\n- "Pourquoi les mots-clés larges tuent les ventes de votre livre sur Amazon A10."\n- "Le guide 2026 pour optimiser vos mots-clés KDP selon l\'algorithme A10."\n- Proposer un audit "A10" des mots-clés pour les auteurs sur la plateforme.',
    importance: 'high',
    source: JSON.stringify(["https://kindlepreneur.com/how-to-choose-kindle-keywords/"])
  },
  {
    title: 'Idée Blog: Catégories instables sur Amazon KDP',
    category: 'blog-idea',
    summary: 'Analyse du courriel "Unsafe book Categories are being added" de Dave Chesson (Kindlepreneur).\n\nSujet : L\'algorithme A10 déplace dynamiquement les livres hors de leurs catégories s\'ils ne performent pas bien dans celles-ci.\n\nConstat : Amazon a commencé à ajouter et retirer des catégories pour les livres basés sur la performance et le comportement des acheteurs. Choisir une catégorie trop compétitive ou non pertinente signifie qu\'Amazon va expulser le livre de cette catégorie.\n\nIdées de contenu pour Read & Rate :\n- "L\'algorithme A10 d\'Amazon vous expulse de vos catégories : Comment réagir ?"\n- "Comment choisir des catégories KDP sûres et rentables en 2026."\n- Créer un outil/checklist Read & Rate pour vérifier la pertinence de ses catégories.',
    importance: 'high',
    source: JSON.stringify(["https://kindlepreneur.com/how-to-choose-the-best-kindle-ebook-kdp-category/"])
  },
  {
    title: 'Idée Blog: Optimiser la description Amazon (Mise à jour)',
    category: 'blog-idea',
    summary: 'Analyse du courriel "A safer way to format your Amazon book description" de Dave Chesson (Kindlepreneur).\n\nSujet : Mise à jour de l\'outil gratuit de description de livre de Kindlepreneur, avec une intégration de "Free Muse" (une IA pour suggérer des améliorations).\n\nIdées de contenu pour Read & Rate :\n- "Comment structurer une description de livre Amazon qui convertit (sans risque de formatage)." \n- Analyser l\'impact d\'une belle description formatée sur les ventes.',
    importance: 'medium',
    source: JSON.stringify(["https://kindlepreneur.com/amazon-book-description-generator/"])
  }
];

async function run() {
  const { data, error } = await supabase.from('intel').insert(intelData);
  if (error) console.error("Error:", error);
  else console.log("Success inserted intel ideas.");
}
run();
