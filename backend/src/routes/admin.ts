import { Router } from "express";
import { env } from "../env";
import { prisma } from "../prisma";
import { computePermissions } from "../auth/permissions";
import { fetchGuildMembers, fetchGuildRoles } from "../auth/discord";
import { requireAuth, requirePerm } from "../middleware/auth";

const router = Router();

router.get("/ping", requirePerm("admin"), (req, res) => {
  res.json({ ok: true, message: "admin pong" });
});

router.get("/members", requireAuth, async (req, res, next) => {
  try {
    const user = res.locals.user;
    const isNathan = env.DISCORD_NATHAN_ID && user.discord_id === env.DISCORD_NATHAN_ID;

    if (!isNathan) {
      if (req.session.isMember === false) {
        return res.status(403).json({ error: "not_member" });
      }

      const membership = await prisma.discordMembershipCache.findUnique({
        where: { user_id: user.id }
      });
      const roleIds = membership?.role_ids ?? [];
      const permissions = computePermissions(roleIds, user.site_admin);
      const hasAdmin = permissions.includes("admin");
      if (!hasAdmin) {
        return res.status(403).json({ error: "forbidden" });
      }
    }

    if (!env.DISCORD_BOT_TOKEN) {
      return res.status(500).json({ error: "missing_bot_token" });
    }

    const [roles, members] = await Promise.all([
      fetchGuildRoles(env.DISCORD_GUILD_ID),
      fetchGuildMembers(env.DISCORD_GUILD_ID)
    ]);

    const roleNameById = new Map(roles.map((role) => [role.id, role.name]));

    const responseMembers = members
      .map((member) => {
        const discordUser = member.user;
        const displayName = member.nick || discordUser.global_name || discordUser.username;
        const roleNames = member.roles
          .map((roleId) => roleNameById.get(roleId) ?? roleId)
          .filter((name) => name !== "@everyone");

        return {
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator ?? null,
          globalName: discordUser.global_name ?? null,
          nick: member.nick ?? null,
          displayName,
          avatar: discordUser.avatar ?? null,
          roles: roleNames
        };
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName));

    return res.json({
      members: responseMembers,
      total: responseMembers.length,
      fetchedAt: new Date().toISOString()
    });
  } catch (error) {
    return next(error);
  }
});

export { router as adminRouter };
