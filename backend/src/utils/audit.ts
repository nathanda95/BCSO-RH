import { prisma } from "../prisma";

type AuditPayload = {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "SIGN";
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
};

export async function auditLog(payload: AuditPayload) {
  const { userId, action, entity, entityId, before, after } = payload;
  return prisma.auditLog.create({
    data: {
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      before_json: before ?? null,
      after_json: after ?? null
    }
  });
}
