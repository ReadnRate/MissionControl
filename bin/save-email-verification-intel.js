const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://zexumnlvkrjryvzrlavp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpleHVtbmx2a3Jqcnl2enJsYXZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjM5MzcyMywiZXhwIjoyMDg3OTY5NzIzfQ.v5Cmj_u93WcDMI3ttwYxVCPWoiblQuUJFB2MXSlO8EM");

async function run() {
  const content = `
# Rapport d'Analyse : Outils de vérification de courriels (Mars 2026)

Recherche pour trouver les meilleurs outils actuels de validation de courriels, avec un focus sur les options de bulk upload (CSV) et la gestion des adresses catch-all.

## 1. Bouncer
- **Catch-all et Bulk (CSV) :** Oui. Réputé pour être l'un des plus précis (99.5%+).
- **Prix :** 100 crédits gratuits. "Pay-as-you-go" d'environ 8$ pour 1000 courriels (0.008$/courriel).

## 2. ZeroBounce
- **Catch-all et Bulk (CSV) :** Oui. Système de pointage avec de l'IA pour détecter les catégories à risque (spam traps, catch-all).
- **Prix :** 100 crédits gratuits. À la carte autour de 8$ pour 1000 courriels. Forfait de départ mensuel à 15$ pour 2000.

## 3. Truelist (Nouveau joueur - Mars 2026)
- **Catch-all et Bulk (CSV) :** Oui. "Validation Améliorée" (Enhanced) avec heuristiques avancées pour les domaines catch-all.
- **Prix :** 200 crédits gratuits. Modèle par abonnement illimité à partir de 39$/mois.

## 4. MillionVerifier
- **Catch-all et Bulk (CSV) :** Oui. 
- **Prix :** Modèle à la carte avec politique de remboursement des crédits pour les résultats "inconnus" et "catch-alls".

## 5. DeBounce
- **Catch-all et Bulk (CSV) :** Oui. Déduplication gratuite.
- **Prix :** 100 crédits gratuits. Les crédits n'expirent jamais. Ne facturent pas pour les résultats inconnus.

**Recommandation pour Read & Rate :**
Pour des listes petites à moyennes : **Bouncer** ou **ZeroBounce** sont les choix les plus sûrs (8$ à 16$ pour nettoyer une liste). 
Si on veut éviter de payer pour les "contact@" indécis, **MillionVerifier** ou **DeBounce** sont de bonnes alternatives grâce à leur politique de remboursement de crédits.
`;

  const { error } = await supabase.from('intel').insert([{
    title: 'Outils de Vérification de Courriels (Bulk & Catch-all)', 
    category: 'research', 
    summary: content, 
    importance: 'normal', 
    source: 'Beacon'
  }]);
  
  if (error) console.error(error);
  else console.log("Intel saved to Supabase.");
}
run();