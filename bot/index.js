import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const autoRoleId = process.env.DISCORD_AUTO_ROLE_ID || process.env.DISCORD_ROLE_CADET_ID;

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in bot/.env");
  process.exit(1);
}

if (!guildId) {
  console.error("Missing DISCORD_GUILD_ID in bot/.env");
  process.exit(1);
}

if (!autoRoleId) {
  console.error("Missing DISCORD_AUTO_ROLE_ID or DISCORD_ROLE_CADET_ID in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  console.log(`Bot connected as ${client.user?.tag ?? "unknown"}`);
  console.log(`Auto role configured: ${autoRoleId}`);

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

client.on("guildMemberAdd", async (member) => {
  if (member.guild.id !== guildId) return;

  try {
    const role =
      member.guild.roles.cache.get(autoRoleId) ?? (await member.guild.roles.fetch(autoRoleId));

    if (!role) {
      console.error("Auto role not found. Check DISCORD_AUTO_ROLE_ID.");
      return;
    }

    if (member.roles.cache.has(autoRoleId)) {
      console.log(`Member ${member.user.tag} already has role ${role.name}`);
      return;
    }

    await member.roles.add(role);
    console.log(`Assigned role ${role.name} to ${member.user.tag}`);
  } catch (error) {
    console.error("Failed to assign auto role. Check bot permissions and role hierarchy.");
    console.error(error);
  }
});

client.login(token);
