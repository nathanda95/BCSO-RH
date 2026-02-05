import { Router } from "express";
import { env } from "../env";
import { prisma } from "../prisma";
import { decryptToken, encryptToken } from "../utils/encryption";
import { computePermissions } from "../auth/permissions";
import { fetchGuildMember, refreshDiscordToken } from "../auth/discord";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = res.locals.user;
  const membership = await prisma.discordMembershipCache.findUnique({
    where: { user_id: user.id }
  });

  const isMember = req.session.isMember !== false;
  const roleIds = isMember ? membership?.role_ids ?? [] : [];
  const permissions = computePermissions(roleIds, user.site_admin);

  res.json({
    user: {
      id: user.id,
      discordId: user.discord_id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      siteAdmin: user.site_admin
    },
    permissions,
    roleIds,
    isMember
  });
});

router.post("/refresh", requireAuth, async (req, res) => {
  const user = res.locals.user;
  const tokens = await prisma.discordTokens.findUnique({
    where: { user_id: user.id }
  });

  if (!tokens) {
    return res.status(401).json({ error: "relogin_required" });
  }

  let accessToken = tokens.access_token;
  let refreshToken = decryptToken(tokens.refresh_token);
  let expiresAt = tokens.expires_at;

  const needsRefresh = expiresAt.getTime() <= Date.now() + 60_000;
  if (needsRefresh) {
    console.info("[auth] Refreshing Discord token");
    const refreshed = await refreshDiscordToken(refreshToken);
    accessToken = refreshed.access_token;
    refreshToken = refreshed.refresh_token ?? refreshToken;
    expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await prisma.discordTokens.update({
      where: { user_id: user.id },
      data: {
        access_token: accessToken,
        refresh_token: encryptToken(refreshToken),
        expires_at: expiresAt
      }
    });
  }

  const member = await fetchGuildMember(accessToken, env.DISCORD_GUILD_ID);
  if (!member) {
    req.session.isMember = false;
    return res.status(403).json({ error: "not_member", isMember: false });
  }

  await prisma.discordMembershipCache.upsert({
    where: { user_id: user.id },
    update: {
      guild_id: env.DISCORD_GUILD_ID,
      role_ids: member.roles,
      synced_at: new Date()
    },
    create: {
      user_id: user.id,
      guild_id: env.DISCORD_GUILD_ID,
      role_ids: member.roles,
      synced_at: new Date()
    }
  });

  req.session.isMember = true;
  const permissions = computePermissions(member.roles, user.site_admin);

  res.json({
    user: {
      id: user.id,
      discordId: user.discord_id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      siteAdmin: user.site_admin
    },
    permissions,
    roleIds: member.roles,
    isMember: true
  });
});

export { router as meRouter };
