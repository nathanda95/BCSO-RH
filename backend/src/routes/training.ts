import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requirePerm } from "../middleware/auth";
import { auditLog } from "../utils/audit";
import { parseBody } from "../utils/validation";

const router = Router();

const moduleSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1).optional().nullable()
});

router.get("/modules", requirePerm("mod"), async (req, res, next) => {
  try {
    const modules = await prisma.trainingModuleDefinition.findMany({
      orderBy: { created_at: "asc" }
    });
    res.json({
      modules: modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        createdAt: module.created_at.toISOString(),
        updatedAt: module.updated_at.toISOString()
      }))
    });
  } catch (error) {
    next(error);
  }
});

router.post("/modules", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(moduleSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const module = await prisma.$transaction(async (tx) => {
      const created = await tx.trainingModuleDefinition.create({
        data: {
          title: parsed.title,
          description: parsed.description ?? null,
          created_by_user_id: res.locals.user.id
        }
      });

      const cadets = await tx.cadet.findMany({
        select: { id: true },
        where: { archived_at: null }
      });
      if (cadets.length > 0) {
        await tx.trainingModule.createMany({
          data: cadets.map((cadet) => ({
            cadet_id: cadet.id,
            module_definition_id: created.id,
            attendance: "PRESENT"
          }))
        });
      }

      return created;
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "CREATE",
      entity: "training.module.definition",
      entityId: module.id,
      before: null,
      after: {
        id: module.id,
        title: module.title,
        description: module.description ?? null
      }
    });

    res.status(201).json({
      module: {
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        createdAt: module.created_at.toISOString(),
        updatedAt: module.updated_at.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put("/modules/:id", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(moduleSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const existing = await prisma.trainingModuleDefinition.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      return res.status(404).json({ error: "not_found" });
    }

    const updated = await prisma.trainingModuleDefinition.update({
      where: { id: req.params.id },
      data: {
        title: parsed.title,
        description: parsed.description ?? null
      }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "training.module.definition",
      entityId: updated.id,
      before: {
        id: existing.id,
        title: existing.title,
        description: existing.description ?? null
      },
      after: {
        id: updated.id,
        title: updated.title,
        description: updated.description ?? null
      }
    });

    res.json({
      module: {
        id: updated.id,
        title: updated.title,
        description: updated.description ?? null,
        createdAt: updated.created_at.toISOString(),
        updatedAt: updated.updated_at.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/modules/:id", requirePerm("mod"), async (req, res, next) => {
  try {
    const existing = await prisma.trainingModuleDefinition.findUnique({
      where: { id: req.params.id }
    });
    if (!existing) {
      return res.status(404).json({ error: "not_found" });
    }

    await prisma.trainingModuleDefinition.delete({
      where: { id: req.params.id }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "DELETE",
      entity: "training.module.definition",
      entityId: existing.id,
      before: {
        id: existing.id,
        title: existing.title,
        description: existing.description ?? null
      },
      after: null
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export { router as trainingRouter };
