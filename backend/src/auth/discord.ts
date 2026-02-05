import { fetch } from "undici";
import { env } from "../env";

const DISCORD_API_BASE = "https://discord.com/api";

export type DiscordTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export type DiscordUser = {
  id: string;
  username: string;
  discriminator?: string;
  avatar?: string | null;
  global_name?: string | null;
};

export type DiscordGuildMember = {
  roles: string[];
};

export function getDiscordAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    scope: "identify guilds.members.read",
    state
  });
  return `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord token exchange failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });

  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord refresh failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordTokenResponse;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord user fetch failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordUser;
}

export async function fetchGuildMember(accessToken: string, guildId: string): Promise<DiscordGuildMember | null> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds/${guildId}/member`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord guild member fetch failed: ${response.status} ${text}`);
  }

  return (await response.json()) as DiscordGuildMember;
}
