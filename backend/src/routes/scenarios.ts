import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requirePerm } from "../middleware/auth";
import { auditLog } from "../utils/audit";
import { parseBody } from "../utils/validation";

const router = Router();

const scenarioSchema = z.object({
  contentText: z.string().trim().min(1)
});

function formatUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator ?? null
  };
}

function snapshotScenario(scenario: any) {
  if (!scenario) return null;
  return {
    id: scenario.id,
    contentText: scenario.content_text,
    updatedAt: scenario.updated_at ? scenario.updated_at.toISOString() : null,
    updatedByUserId: scenario.updated_by_user_id ?? null
  };
}

router.get("/", requirePerm("mod"), async (req, res, next) => {
  try {
    let scenario = await prisma.scenario.findFirst({
      orderBy: { updated_at: "desc" },
      include: { updated_by: true }
    });

    if (!scenario) {
      scenario = await prisma.scenario.create({
        data: {
          content_text: "",
          updated_by_user_id: null
        },
        include: { updated_by: true }
      });
    }

    res.json({
      scenario: {
        id: scenario.id,
        contentText: scenario.content_text,
        updatedAt: scenario.updated_at.toISOString(),
        updatedBy: formatUser(scenario.updated_by)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/", requirePerm("admin"), async (req, res, next) => {
  try {
    const parsed = parseBody(scenarioSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const existing = await prisma.scenario.findFirst({
      orderBy: { updated_at: "desc" }
    });

    const updated = existing
      ? await prisma.scenario.update({
          where: { id: existing.id },
          data: {
            content_text: parsed.contentText,
            updated_by_user_id: res.locals.user.id
          },
          include: { updated_by: true }
        })
      : await prisma.scenario.create({
          data: {
            content_text: parsed.contentText,
            updated_by_user_id: res.locals.user.id
          },
          include: { updated_by: true }
        });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "scenario",
      entityId: updated.id,
      before: snapshotScenario(existing),
      after: snapshotScenario(updated)
    });

    res.json({
      scenario: {
        id: updated.id,
        contentText: updated.content_text,
        updatedAt: updated.updated_at.toISOString(),
        updatedBy: formatUser(updated.updated_by)
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as scenariosRouter };
