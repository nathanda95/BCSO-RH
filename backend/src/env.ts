import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),
  FRONTEND_URL: requireEnv("FRONTEND_URL"),
  SESSION_SECRET: requireEnv("SESSION_SECRET"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
  DISCORD_CLIENT_ID: requireEnv("DISCORD_CLIENT_ID"),
  DISCORD_CLIENT_SECRET: requireEnv("DISCORD_CLIENT_SECRET"),
  DISCORD_REDIRECT_URI: requireEnv("DISCORD_REDIRECT_URI"),
  DISCORD_GUILD_ID: requireEnv("DISCORD_GUILD_ID"),
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ?? "",
  DISCORD_ROLE_ADMIN_ID: process.env.DISCORD_ROLE_ADMIN_ID ?? "",
  DISCORD_ROLE_MOD_ID: process.env.DISCORD_ROLE_MOD_ID ?? "",
  DISCORD_ROLE_PREMIUM_ID: process.env.DISCORD_ROLE_PREMIUM_ID ?? "",
  DISCORD_ROLE_CADET_ID: process.env.DISCORD_ROLE_CADET_ID ?? "",
  APP_ENCRYPTION_KEY: process.env.APP_ENCRYPTION_KEY ?? "",
  DISCORD_NATHAN_ID:
    process.env.DISCORD_NATHAN_ID ??
    process.env.DISCORD_NATHAN_ADMIN ??
    ""
};

