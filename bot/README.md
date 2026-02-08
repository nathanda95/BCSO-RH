# BCSO-RH Discord Bot (minimal)

Ce bot ne fait rien de visible. Il sert uniquement a:
- etre invite sur le serveur
- fournir un token bot valide pour l'API qui liste les membres

## Etapes
1. Creer un bot dans Discord Developer Portal (onglet Bot).
2. Activer l'intent "Server Members" dans le portail.
3. Inviter le bot sur le serveur.
4. Copier le token dans `bot/.env` et dans `backend/.env` (DISCORD_BOT_TOKEN).

## Lancer
```bash
cd bot
npm install
npm start
```

Si tout est ok, la console affichera le nombre de membres.
