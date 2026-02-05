import { Router } from "express";
import crypto from "crypto";
import { env } from "../env";
import { prisma } from "../prisma";
import { encryptToken } from "../utils/encryption";
import {
  exchangeCodeForToken,
  fetchDiscordUser,
  fetchGuildMember,
  getDiscordAuthorizeUrl
} from "../auth/discord";

const router = Router();

function redirectForbidden(res: any, reason: string) {
  const url = new URL("/forbidden", env.FRONTEND_URL);
  url.searchParams.set("reason", reason);
  return res.redirect(url.toString());
}

router.get("/discord/login", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  req.session.oauthState = state;

  const url = getDiscordAuthorizeUrl(state);
  console.info("[auth] Redirecting to Discord OAuth");
  res.redirect(url);
});

router.get("/discord/callback", async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.info("[auth] Discord returned error", error);
      return redirectForbidden(res, "oauth_error");
    }

    if (!code || !state || typeof code !== "string" || typeof state !== "string") {
      return redirectForbidden(res, "missing_params");
    }

    if (state !== req.session.oauthState) {
      return redirectForbidden(res, "state_mismatch");
    }

    req.session.oauthState = undefined;

    console.info("[auth] Exchanging code for token");
    const token = await exchangeCodeForToken(code);

    console.info("[auth] Fetching user");
    const discordUser = await fetchDiscordUser(token.access_token);

    console.info("[auth] Checking guild membership");
    const member = await fetchGuildMember(token.access_token, env.DISCORD_GUILD_ID);
    if (!member) {
      console.info("[auth] User not in guild");
      req.session.isMember = false;
      return redirectForbidden(res, "not_member");
    }

    const user = await prisma.user.upsert({
      where: { discord_id: discordUser.id },
      update: {
        username: discordUser.username,
        discriminator: discordUser.discriminator ?? null,
        avatar: discordUser.avatar ?? null
      },
      create: {
        discord_id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator ?? null,
        avatar: discordUser.avatar ?? null
      }
    });

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

    await prisma.discordTokens.upsert({
      where: { user_id: user.id },
      update: {
        access_token: token.access_token,
        refresh_token: encryptToken(token.refresh_token),
        expires_at: new Date(Date.now() + token.expires_in * 1000)
      },
      create: {
        user_id: user.id,
        access_token: token.access_token,
        refresh_token: encryptToken(token.refresh_token),
        expires_at: new Date(Date.now() + token.expires_in * 1000)
      }
    });

    req.session.userId = user.id;
    req.session.isMember = true;

    console.info("[auth] Login success");
    const redirectUrl = new URL("/app", env.FRONTEND_URL);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("[auth] Callback failed", error);
    return redirectForbidden(res, "callback_failed");
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("[auth] Logout error", err);
      return res.status(500).json({ error: "logout_failed" });
    }
    res.clearCookie("connect.sid");
    return res.json({ ok: true });
  });
});

export { router as authRouter };
