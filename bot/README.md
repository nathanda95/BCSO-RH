# BCSO-RH Discord Bot (minimal)

Ce bot ne fait rien de visible. Il sert uniquement a:
- etre invite sur le serveur
- fournir un token bot valide pour l'API qui liste les membres
- attribuer automatiquement un role aux nouveaux membres

## Etapes
1. Creer un bot dans Discord Developer Portal (onglet Bot).
2. Activer l'intent "Server Members" dans le portail.
3. Inviter le bot sur le serveur avec la permission "Manage Roles".
4. Copier le token dans `bot/.env` et dans `backend/.env` (DISCORD_BOT_TOKEN).
5. Ajouter `DISCORD_GUILD_ID` (id du serveur) et `DISCORD_AUTO_ROLE_ID` (id du role auto) dans `bot/.env`.
6. Verifier que le role du bot est au-dessus du role auto dans la hierarchie des roles Discord.

## Lancer
```bash
cd bot
npm install
npm start
```

Si tout est ok, la console affichera le nombre de membres.
