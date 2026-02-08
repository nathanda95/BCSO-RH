import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in bot/.env");
  process.exit(1);
}

if (!guildId) {
  console.error("Missing DISCORD_GUILD_ID in bot/.env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  console.log(`Bot connected as ${client.user?.tag ?? "unknown"}`);

  const guild = client.guilds.cache.get(guildId) ?? (await client.guilds.fetch(guildId));
  if (!guild) {
    console.error("Guild not found. Check DISCORD_GUILD_ID.");
    process.exit(1);
  }

  try {
    const members = await guild.members.fetch();
    console.log(`Members fetched: ${members.size}`);
  } catch (error) {
    console.error("Failed to fetch members. Ensure Server Members Intent is enabled.");
    console.error(error);
  }
});

client.login(token);
