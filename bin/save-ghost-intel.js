const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const content = `Analyse du courriel "Amazon is hiding" de Dave Chesson (Kindlepreneur) reçu le 12 Mars 2026.

Sujet : Le fléau croissant des "Ghost Categories" sur Amazon KDP.

1. Constat de Dave Chesson : 
Amazon a ajouté 958 nouvelles "ghost categories" dans les 6 derniers mois (environ 27% à 29% de toutes les catégories listées dans KDP sont maintenant des "fantômes").

2. C'est quoi une Ghost Category ?
C'est une catégorie qui existe dans le menu déroulant backend de KDP (quand l'auteur publie son livre), mais qui N'EXISTE PAS sur le site public d'Amazon (la boutique). 
Conséquences fatales pour l'auteur :
- Les lecteurs ne peuvent pas naviguer dans cette catégorie.
- Le livre ne peut pas obtenir de badge "Bestseller".
- Visibilité organique réduite à néant dans cette niche.

3. Pourquoi est-ce si grave aujourd'hui ?
Depuis que KDP a limité les auteurs à seulement 3 catégories (au lieu de 10 auparavant via le support), gaspiller un slot sur une "ghost category" ruine le lancement du livre.

4. L'outil mis en avant : Publisher Rocket (produit de Dave Chesson) intègre maintenant un filtre pour flagger et éviter ces ghost categories.

PISTES DE CONTENU / BLOG (Pour Read & Rate) :
- "Comment vérifier si votre livre Amazon est piégé dans une Ghost Category en 2026." (Méthode manuelle : vérifier le chemin URL d'Amazon depuis une navigation privée).
- "Pourquoi 29% des catégories KDP détruisent votre visibilité (et comment y remédier)."
- Offrir un service ou un guide Read & Rate pour auditer les 3 catégories choisies par les auteurs afin de s'assurer qu'elles sont "vivantes" et compétitives.`;

  const { data, error } = await supabase.from('intel').insert([{
    title: 'Analyse Newsletter : Le Fléau des "Ghost Categories" sur KDP (Dave Chesson)', 
    category: 'blog-idea', 
    summary: content, 
    importance: 'high', 
    source: 'Inbox: Dave Chesson (Kindlepreneur) & Web Search'
  }]);
  
  if (error) console.error(error);
  else console.log("Inserted analysis successfully");
}
run();
