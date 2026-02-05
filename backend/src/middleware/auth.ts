import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";
import { computePermissions, Permission } from "../auth/permissions";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
  if (!user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  res.locals.user = user;
  next();
}

export function requirePerm(required: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (req.session.isMember === false) {
      return res.status(403).json({ error: "not_member" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.session.userId } });
    if (!user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const membership = await prisma.discordMembershipCache.findUnique({
      where: { user_id: user.id }
    });

    const roleIds = membership?.role_ids ?? [];
    const permissions = computePermissions(roleIds, user.site_admin);

    const hasAdmin = permissions.includes("admin");
    const hasRequired = permissions.includes(required);
    if (!hasAdmin && !hasRequired) {
      return res.status(403).json({ error: "forbidden" });
    }

    res.locals.user = user;
    res.locals.permissions = permissions;
    next();
  };
}
