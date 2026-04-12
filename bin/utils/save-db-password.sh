#!/bin/bash
# Ce script permet à Manuel d'injecter le mot de passe de façon sécurisée
# sans qu'il reste dans les logs du chat ou les fichiers textes en clair.

read -s -p "Entre le nouveau mot de passe Supabase: " DBPASS
echo ""

echo "SUPABASE_DB_PASSWORD=\"$DBPASS\"" >> /data/.openclaw/workspace/.env.secrets
echo "DATABASE_URL=\"postgresql://postgres.zexumnlvkrjryvzrlavp:$DBPASS@aws-0-us-west-2.pooler.supabase.com:6543/postgres\"" >> /data/.openclaw/workspace/.env.secrets
chmod 600 /data/.openclaw/workspace/.env.secrets

echo "Mot de passe sauvegardé dans .env.secrets (accès restreint)."
