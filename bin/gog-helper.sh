#!/bin/bash
# GOG Helper - Wrapper pour simplifier l'utilisation de gog

# Load keyring password
export GOG_KEYRING_PASSWORD=$(cat /data/.openclaw/workspace/credentials/.gog_keyring_password)
export GOG_ACCOUNT=manu.denault@gmail.com

# Execute gog command with env vars
exec gog "$@"
