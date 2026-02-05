import { env } from "../env";

export type Permission = "admin" | "mod" | "premium";

export function computePermissions(roleIds: string[], siteAdmin: boolean): Permission[] {
  const perms = new Set<Permission>();

  if (siteAdmin) {
    perms.add("admin");
  }

  if (env.DISCORD_ROLE_ADMIN_ID && roleIds.includes(env.DISCORD_ROLE_ADMIN_ID)) {
    perms.add("admin");
  }
  if (env.DISCORD_ROLE_MOD_ID && roleIds.includes(env.DISCORD_ROLE_MOD_ID)) {
    perms.add("mod");
  }
  if (env.DISCORD_ROLE_PREMIUM_ID && roleIds.includes(env.DISCORD_ROLE_PREMIUM_ID)) {
    perms.add("premium");
  }

  return Array.from(perms);
}
