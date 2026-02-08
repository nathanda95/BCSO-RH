import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, requirePerm } from "../middleware/auth";
import { computePermissions } from "../auth/permissions";
import { auditLog } from "../utils/audit";
import { parseBody } from "../utils/validation";

const router = Router();

const cadetCreateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  cadetNumber: z.string().trim().min(1),
  birthDate: z.string().trim().min(1).optional().nullable(),
  userName: z.string().trim().min(1).optional().nullable()
});

const cadetUpdateSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  cadetNumber: z.string().trim().min(1).optional(),
  birthDate: z.string().trim().min(1).optional().nullable(),
  userName: z.string().trim().min(1).optional().nullable()
});

const recruitmentStatusSchema = z.enum(["PENDING", "VALIDATED", "REFUSED"]);
const attendanceStatusSchema = z.enum(["PRESENT", "ABSENT", "LATE"]);
const evaluationStatusSchema = z.enum(["ACQUIRED", "NOT_ACQUIRED"]);

const questionnaireSchema = z.object({
  spreadsheetUrl: z.string().trim().min(1).optional().nullable(),
  answersText: z.string().trim().min(1).optional().nullable(),
  comment: z.string().trim().min(1).optional().nullable(),
  status: recruitmentStatusSchema.optional()
});

const sportSchema = z.object({
  comment: z.string().trim().min(1).optional().nullable(),
  timeMinutes: z.number().int().min(0).optional().nullable(),
  status: recruitmentStatusSchema.optional()
});

const medicalSchema = z.object({
  comment: z.string().trim().min(1).optional().nullable(),
  status: recruitmentStatusSchema.optional()
});

const trainingSchema = z.object({
  comment: z.string().trim().min(1).optional().nullable(),
  rating1to10: z.number().int().min(1).max(10).optional().nullable(),
  attendance: attendanceStatusSchema.optional()
});

const evaluationSchema = z.object({
  weeklyAverage: z.number().optional().nullable(),
  generalComment: z.string().trim().min(1).optional().nullable(),
  writtenTestScore: z.number().optional().nullable(),
  scenarioScore: z.number().optional().nullable(),
  totalScore: z.number().optional().nullable(),
  ppa: evaluationStatusSchema.optional(),
  training: evaluationStatusSchema.optional()
});

const signSchema = z.object({
  scope: z.enum([
    "recruitment.questionnaire",
    "recruitment.sport",
    "recruitment.medical",
    "training.module",
    "evaluation"
  ]),
  moduleId: z.string().uuid().optional()
});

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function isAdmin(res: any) {
  const permissions = res.locals.permissions ?? [];
  return permissions.includes("admin");
}

function formatUser(user: any) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    discriminator: user.discriminator ?? null
  };
}

function formatCadet(cadet: any) {
  return {
    id: cadet.id,
    firstName: cadet.first_name,
    lastName: cadet.last_name,
    cadetNumber: cadet.cadet_number,
    userId: cadet.user_id ?? null,
    userName: cadet.user?.username ?? null,
    birthDate: cadet.birth_date ? cadet.birth_date.toISOString() : null
  };
}

function formatRecruitment(recruitment: any) {
  if (!recruitment) {
    return null;
  }
  return {
    questionnaire: {
      spreadsheetUrl: recruitment.questionnaire_spreadsheet_url ?? null,
      answersText: recruitment.questionnaire_answers_text ?? null,
      comment: recruitment.questionnaire_comment ?? null,
      status: recruitment.questionnaire_status,
      signedBy: formatUser(recruitment.questionnaire_signed_by),
      signedAt: recruitment.questionnaire_signed_at
        ? recruitment.questionnaire_signed_at.toISOString()
        : null
    },
    sport: {
      comment: recruitment.sport_comment ?? null,
      timeMinutes: recruitment.sport_time_minutes ?? null,
      status: recruitment.sport_status,
      signedBy: formatUser(recruitment.sport_signed_by),
      signedAt: recruitment.sport_signed_at ? recruitment.sport_signed_at.toISOString() : null
    },
    medical: {
      comment: recruitment.medical_comment ?? null,
      status: recruitment.medical_status,
      signedBy: formatUser(recruitment.medical_signed_by),
      signedAt: recruitment.medical_signed_at ? recruitment.medical_signed_at.toISOString() : null
    }
  };
}

function formatTraining(modules: any[]) {
  return modules.map((module) => ({
    id: module.id,
    moduleId: module.module_definition_id,
    moduleTitle: module.moduleDefinition?.title ?? null,
    moduleDescription: module.moduleDefinition?.description ?? null,
    comment: module.comment ?? null,
    rating1to10: module.rating_1_10 ?? null,
    attendance: module.attendance,
    signedBy: formatUser(module.signed_by),
    signedAt: module.signed_at ? module.signed_at.toISOString() : null
  }));
}

function formatTrainingModule(module: any) {
  if (!module) return null;
  return {
    id: module.id,
    moduleId: module.module_definition_id,
    moduleTitle: module.moduleDefinition?.title ?? null,
    moduleDescription: module.moduleDefinition?.description ?? null,
    comment: module.comment ?? null,
    rating1to10: module.rating_1_10 ?? null,
    attendance: module.attendance,
    signedBy: formatUser(module.signed_by),
    signedAt: module.signed_at ? module.signed_at.toISOString() : null
  };
}

function formatEvaluation(evaluation: any) {
  if (!evaluation) return null;
  return {
    weeklyAverage: evaluation.weekly_average ?? null,
    generalComment: evaluation.general_comment ?? null,
    writtenTestScore: evaluation.written_test_score ?? null,
    scenarioScore: evaluation.scenario_score ?? null,
    totalScore: evaluation.total_score ?? null,
    ppa: evaluation.ppa,
    training: evaluation.training,
    signedBy: formatUser(evaluation.signed_by),
    signedAt: evaluation.signed_at ? evaluation.signed_at.toISOString() : null
  };
}

async function getCadetDetail(cadetId: string) {
  const cadet = await prisma.cadet.findUnique({
    where: { id: cadetId },
    include: {
      user: true,
      recruitment: {
        include: {
          questionnaire_signed_by: true,
          sport_signed_by: true,
          medical_signed_by: true
        }
      },
      trainingModules: {
        include: { signed_by: true, moduleDefinition: true },
        orderBy: { moduleDefinition: { title: "asc" } }
      },
      evaluation: {
        include: { signed_by: true }
      }
    }
  });

  if (!cadet) {
    return null;
  }

  return {
    ...formatCadet(cadet),
    recruitment: formatRecruitment(cadet.recruitment),
    trainingModules: formatTraining(cadet.trainingModules ?? []),
    evaluation: formatEvaluation(cadet.evaluation)
  };
}

async function resolveUserIdByName(userName: string) {
  const users = await prisma.user.findMany({
    where: { username: userName }
  });
  if (users.length === 0) {
    return { userId: null, error: "user_not_found" as const };
  }
  if (users.length > 1) {
    return { userId: null, error: "user_ambiguous" as const };
  }
  return { userId: users[0].id, error: null };
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = res.locals.user;

    if (req.session.isMember === false) {
      return res.status(403).json({ error: "not_member" });
    }

    const membership = await prisma.discordMembershipCache.findUnique({
      where: { user_id: user.id }
    });
    const roleIds = membership?.role_ids ?? [];
    const permissions = computePermissions(roleIds, user.site_admin);

    const hasAccess =
      permissions.includes("admin") || permissions.includes("mod") || permissions.includes("cadet");
    if (!hasAccess) {
      return res.status(403).json({ error: "forbidden" });
    }

    const cadet = await prisma.cadet.findFirst({ where: { user_id: user.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const detail = await getCadetDetail(cadet.id);
    res.json({ cadet: detail });
  } catch (error) {
    next(error);
  }
});

router.get("/", requirePerm("mod"), async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = search
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { cadet_number: { contains: search, mode: "insensitive" } }
          ]
        }
      : undefined;

    const cadets = await prisma.cadet.findMany({
      where,
      orderBy: [{ last_name: "asc" }, { first_name: "asc" }]
    });

    res.json({
      cadets: cadets.map(formatCadet)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(cadetCreateSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const birthDate = parseDate(parsed.birthDate ?? null);
    if (parsed.birthDate && !birthDate) {
      return res.status(400).json({ error: "invalid_birth_date" });
    }

    let userId: string | null = null;
    if (parsed.userName) {
      const resolved = await resolveUserIdByName(parsed.userName);
      if (resolved.error === "user_not_found") {
        return res.status(400).json({ error: "user_not_found" });
      }
      if (resolved.error === "user_ambiguous") {
        return res.status(409).json({ error: "user_ambiguous" });
      }
      userId = resolved.userId;
    }

    const cadet = await prisma.$transaction(async (tx) => {
      const created = await tx.cadet.create({
        data: {
          first_name: parsed.firstName,
          last_name: parsed.lastName,
          cadet_number: parsed.cadetNumber,
          user_id: userId,
          birth_date: birthDate
        }
      });

      await tx.recruitment.create({
        data: { cadet_id: created.id }
      });

      await tx.evaluation.create({
        data: { cadet_id: created.id }
      });

      const definitions = await tx.trainingModuleDefinition.findMany();
      if (definitions.length > 0) {
        await tx.trainingModule.createMany({
          data: definitions.map((definition) => ({
            cadet_id: created.id,
            module_definition_id: definition.id,
            attendance: "PRESENT"
          }))
        });
      }

      return created;
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "CREATE",
      entity: "cadet",
      entityId: cadet.id,
      before: null,
      after: formatCadet(cadet)
    });

    const detail = await getCadetDetail(cadet.id);
    res.status(201).json({ cadet: detail });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "cadet_number_exists" });
    }
    next(error);
  }
});

router.get("/:id", requirePerm("mod"), async (req, res, next) => {
  try {
    const cadet = await getCadetDetail(req.params.id);
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }
    res.json({ cadet });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(cadetUpdateSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const birthDate = parseDate(parsed.birthDate ?? null);
    if (parsed.birthDate && !birthDate) {
      return res.status(400).json({ error: "invalid_birth_date" });
    }

    const existing = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "not_found" });
    }

    let userId: string | null | undefined = undefined;
    if (parsed.userName !== undefined) {
      if (parsed.userName === null) {
        userId = null;
      } else {
        const resolved = await resolveUserIdByName(parsed.userName);
        if (resolved.error === "user_not_found") {
          return res.status(400).json({ error: "user_not_found" });
        }
        if (resolved.error === "user_ambiguous") {
          return res.status(409).json({ error: "user_ambiguous" });
        }
        userId = resolved.userId;
      }
    }

    const updated = await prisma.cadet.update({
      where: { id: req.params.id },
      data: {
        first_name: parsed.firstName ?? undefined,
        last_name: parsed.lastName ?? undefined,
        cadet_number: parsed.cadetNumber ?? undefined,
        user_id: userId,
        birth_date: parsed.birthDate !== undefined ? birthDate : undefined
      }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "cadet",
      entityId: updated.id,
      before: formatCadet(existing),
      after: formatCadet(updated)
    });

    const detail = await getCadetDetail(updated.id);
    res.json({ cadet: detail });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "cadet_number_exists" });
    }
    next(error);
  }
});

router.delete("/:id", requirePerm("admin"), async (req, res, next) => {
  try {
    const existing = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: "not_found" });
    }

    await prisma.cadet.delete({ where: { id: req.params.id } });

    await auditLog({
      userId: res.locals.user.id,
      action: "DELETE",
      entity: "cadet",
      entityId: existing.id,
      before: formatCadet(existing),
      after: null
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/recruitment/questionnaire", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(questionnaireSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const recruitment = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
    if (recruitment?.questionnaire_signed_at && !isAdmin(res)) {
      return res.status(409).json({ error: "section_locked" });
    }

    const updated = await prisma.recruitment.upsert({
      where: { cadet_id: cadet.id },
      update: {
        questionnaire_spreadsheet_url: parsed.spreadsheetUrl ?? undefined,
        questionnaire_answers_text: parsed.answersText ?? undefined,
        questionnaire_comment: parsed.comment ?? undefined,
        questionnaire_status: parsed.status ?? undefined
      },
      create: {
        cadet_id: cadet.id,
        questionnaire_spreadsheet_url: parsed.spreadsheetUrl ?? null,
        questionnaire_answers_text: parsed.answersText ?? null,
        questionnaire_comment: parsed.comment ?? null,
        questionnaire_status: parsed.status ?? "PENDING"
      },
      include: {
        questionnaire_signed_by: true,
        sport_signed_by: true,
        medical_signed_by: true
      }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "recruitment.questionnaire",
      entityId: cadet.id,
      before: formatRecruitment(recruitment) ?? null,
      after: formatRecruitment(updated)
    });

    res.json({
      recruitment: formatRecruitment(updated)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/recruitment/sport", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(sportSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const recruitment = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
    if (recruitment?.sport_signed_at && !isAdmin(res)) {
      return res.status(409).json({ error: "section_locked" });
    }

    const updated = await prisma.recruitment.upsert({
      where: { cadet_id: cadet.id },
      update: {
        sport_comment: parsed.comment ?? undefined,
        sport_time_minutes: parsed.timeMinutes ?? undefined,
        sport_status: parsed.status ?? undefined
      },
      create: {
        cadet_id: cadet.id,
        sport_comment: parsed.comment ?? null,
        sport_time_minutes: parsed.timeMinutes ?? null,
        sport_status: parsed.status ?? "PENDING"
      },
      include: {
        questionnaire_signed_by: true,
        sport_signed_by: true,
        medical_signed_by: true
      }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "recruitment.sport",
      entityId: cadet.id,
      before: formatRecruitment(recruitment) ?? null,
      after: formatRecruitment(updated)
    });

    res.json({
      recruitment: formatRecruitment(updated)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/recruitment/medical", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(medicalSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const recruitment = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
    if (recruitment?.medical_signed_at && !isAdmin(res)) {
      return res.status(409).json({ error: "section_locked" });
    }

    const updated = await prisma.recruitment.upsert({
      where: { cadet_id: cadet.id },
      update: {
        medical_comment: parsed.comment ?? undefined,
        medical_status: parsed.status ?? undefined
      },
      create: {
        cadet_id: cadet.id,
        medical_comment: parsed.comment ?? null,
        medical_status: parsed.status ?? "PENDING"
      },
      include: {
        questionnaire_signed_by: true,
        sport_signed_by: true,
        medical_signed_by: true
      }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "recruitment.medical",
      entityId: cadet.id,
      before: formatRecruitment(recruitment) ?? null,
      after: formatRecruitment(updated)
    });

    res.json({
      recruitment: formatRecruitment(updated)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/training/modules/:moduleId", requirePerm("mod"), async (req, res, next) => {
  try {
    const moduleId = req.params.moduleId;

    const parsed = parseBody(trainingSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const existing = await prisma.trainingModule.findUnique({
      where: {
        cadet_id_module_definition_id: {
          cadet_id: cadet.id,
          module_definition_id: moduleId
        }
      },
      include: { moduleDefinition: true }
    });

    if (existing?.signed_at && !isAdmin(res)) {
      return res.status(409).json({ error: "section_locked" });
    }

    const updated = await prisma.trainingModule.upsert({
      where: {
        cadet_id_module_definition_id: {
          cadet_id: cadet.id,
          module_definition_id: moduleId
        }
      },
      update: {
        comment: parsed.comment ?? undefined,
        rating_1_10: parsed.rating1to10 ?? undefined,
        attendance: parsed.attendance ?? undefined
      },
      create: {
        cadet_id: cadet.id,
        module_definition_id: moduleId,
        comment: parsed.comment ?? null,
        rating_1_10: parsed.rating1to10 ?? null,
        attendance: parsed.attendance ?? "PRESENT"
      },
      include: { signed_by: true, moduleDefinition: true }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "training.module",
      entityId: cadet.id,
      before: formatTrainingModule(existing),
      after: formatTrainingModule(updated)
    });

    res.json({
      module: {
        id: updated.id,
        moduleId: updated.module_definition_id,
        moduleTitle: updated.moduleDefinition?.title ?? null,
        moduleDescription: updated.moduleDefinition?.description ?? null,
        comment: updated.comment ?? null,
        rating1to10: updated.rating_1_10 ?? null,
        attendance: updated.attendance,
        signedBy: formatUser(updated.signed_by),
        signedAt: updated.signed_at ? updated.signed_at.toISOString() : null
      }
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/evaluation", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(evaluationSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const existing = await prisma.evaluation.findUnique({ where: { cadet_id: cadet.id } });
    if (existing?.signed_at && !isAdmin(res)) {
      return res.status(409).json({ error: "section_locked" });
    }

    const updated = await prisma.evaluation.upsert({
      where: { cadet_id: cadet.id },
      update: {
        weekly_average: parsed.weeklyAverage ?? undefined,
        general_comment: parsed.generalComment ?? undefined,
        written_test_score: parsed.writtenTestScore ?? undefined,
        scenario_score: parsed.scenarioScore ?? undefined,
        total_score: parsed.totalScore ?? undefined,
        ppa: parsed.ppa ?? undefined,
        training: parsed.training ?? undefined
      },
      create: {
        cadet_id: cadet.id,
        weekly_average: parsed.weeklyAverage ?? null,
        general_comment: parsed.generalComment ?? null,
        written_test_score: parsed.writtenTestScore ?? null,
        scenario_score: parsed.scenarioScore ?? null,
        total_score: parsed.totalScore ?? null,
        ppa: parsed.ppa ?? "NOT_ACQUIRED",
        training: parsed.training ?? "NOT_ACQUIRED"
      },
      include: { signed_by: true }
    });

    await auditLog({
      userId: res.locals.user.id,
      action: "UPDATE",
      entity: "evaluation",
      entityId: cadet.id,
      before: formatEvaluation(existing),
      after: formatEvaluation(updated)
    });

    res.json({
      evaluation: formatEvaluation(updated)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sign", requirePerm("mod"), async (req, res, next) => {
  try {
    const parsed = parseBody(signSchema, req.body);
    if (!parsed) {
      return res.status(400).json({ error: "invalid_body" });
    }

    if (parsed.scope === "training.module" && !parsed.moduleId) {
      return res.status(400).json({ error: "missing_module_id" });
    }

    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const signerId = res.locals.user.id;
    const signedAt = new Date();

    if (parsed.scope === "recruitment.questionnaire") {
      const existing = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
      if (existing?.questionnaire_signed_at) {
        return res.status(409).json({ error: "already_signed" });
      }
      const updated = await prisma.recruitment.upsert({
        where: { cadet_id: cadet.id },
        update: {
          questionnaire_signed_by_user_id: signerId,
          questionnaire_signed_at: signedAt
        },
        create: {
          cadet_id: cadet.id,
          questionnaire_signed_by_user_id: signerId,
          questionnaire_signed_at: signedAt
        },
        include: {
          questionnaire_signed_by: true,
          sport_signed_by: true,
          medical_signed_by: true
        }
      });
      await auditLog({
        userId: signerId,
        action: "SIGN",
        entity: "recruitment.questionnaire",
        entityId: cadet.id,
        before: formatRecruitment(existing),
        after: formatRecruitment(updated)
      });
      return res.json({ recruitment: formatRecruitment(updated) });
    }

    if (parsed.scope === "recruitment.sport") {
      const existing = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
      if (existing?.sport_signed_at) {
        return res.status(409).json({ error: "already_signed" });
      }
      const updated = await prisma.recruitment.upsert({
        where: { cadet_id: cadet.id },
        update: {
          sport_signed_by_user_id: signerId,
          sport_signed_at: signedAt
        },
        create: {
          cadet_id: cadet.id,
          sport_signed_by_user_id: signerId,
          sport_signed_at: signedAt
        },
        include: {
          questionnaire_signed_by: true,
          sport_signed_by: true,
          medical_signed_by: true
        }
      });
      await auditLog({
        userId: signerId,
        action: "SIGN",
        entity: "recruitment.sport",
        entityId: cadet.id,
        before: formatRecruitment(existing),
        after: formatRecruitment(updated)
      });
      return res.json({ recruitment: formatRecruitment(updated) });
    }

    if (parsed.scope === "recruitment.medical") {
      const existing = await prisma.recruitment.findUnique({ where: { cadet_id: cadet.id } });
      if (existing?.medical_signed_at) {
        return res.status(409).json({ error: "already_signed" });
      }
      const updated = await prisma.recruitment.upsert({
        where: { cadet_id: cadet.id },
        update: {
          medical_signed_by_user_id: signerId,
          medical_signed_at: signedAt
        },
        create: {
          cadet_id: cadet.id,
          medical_signed_by_user_id: signerId,
          medical_signed_at: signedAt
        },
        include: {
          questionnaire_signed_by: true,
          sport_signed_by: true,
          medical_signed_by: true
        }
      });
      await auditLog({
        userId: signerId,
        action: "SIGN",
        entity: "recruitment.medical",
        entityId: cadet.id,
        before: formatRecruitment(existing),
        after: formatRecruitment(updated)
      });
      return res.json({ recruitment: formatRecruitment(updated) });
    }

    if (parsed.scope === "training.module") {
      const moduleId = parsed.moduleId as string;
      const existing = await prisma.trainingModule.findUnique({
        where: {
          cadet_id_module_definition_id: {
            cadet_id: cadet.id,
            module_definition_id: moduleId
          }
        },
        include: { moduleDefinition: true }
      });
      if (existing?.signed_at) {
        return res.status(409).json({ error: "already_signed" });
      }
      const updated = await prisma.trainingModule.upsert({
        where: {
          cadet_id_module_definition_id: {
            cadet_id: cadet.id,
            module_definition_id: moduleId
          }
        },
        update: {
          signed_by_user_id: signerId,
          signed_at: signedAt
        },
        create: {
          cadet_id: cadet.id,
          module_definition_id: moduleId,
          signed_by_user_id: signerId,
          signed_at: signedAt,
          attendance: "PRESENT"
        },
        include: { signed_by: true, moduleDefinition: true }
      });
      await auditLog({
        userId: signerId,
        action: "SIGN",
        entity: "training.module",
        entityId: cadet.id,
        before: formatTrainingModule(existing),
        after: formatTrainingModule(updated)
      });
      return res.json({
        module: {
          id: updated.id,
          moduleId: updated.module_definition_id,
          moduleTitle: updated.moduleDefinition?.title ?? null,
          moduleDescription: updated.moduleDefinition?.description ?? null,
          comment: updated.comment ?? null,
          rating1to10: updated.rating_1_10 ?? null,
          attendance: updated.attendance,
          signedBy: formatUser(updated.signed_by),
          signedAt: updated.signed_at ? updated.signed_at.toISOString() : null
        }
      });
    }

    if (parsed.scope === "evaluation") {
      const existing = await prisma.evaluation.findUnique({ where: { cadet_id: cadet.id } });
      if (existing?.signed_at) {
        return res.status(409).json({ error: "already_signed" });
      }
      const updated = await prisma.evaluation.upsert({
        where: { cadet_id: cadet.id },
        update: {
          signed_by_user_id: signerId,
          signed_at: signedAt
        },
        create: {
          cadet_id: cadet.id,
          signed_by_user_id: signerId,
          signed_at: signedAt,
          ppa: "NOT_ACQUIRED",
          training: "NOT_ACQUIRED"
        },
        include: { signed_by: true }
      });
      await auditLog({
        userId: signerId,
        action: "SIGN",
        entity: "evaluation",
        entityId: cadet.id,
        before: formatEvaluation(existing),
        after: formatEvaluation(updated)
      });
      return res.json({ evaluation: formatEvaluation(updated) });
    }

    return res.status(400).json({ error: "invalid_scope" });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/audit", requirePerm("mod"), async (req, res, next) => {
  try {
    const cadet = await prisma.cadet.findUnique({ where: { id: req.params.id } });
    if (!cadet) {
      return res.status(404).json({ error: "not_found" });
    }

    const logs = await prisma.auditLog.findMany({
      where: { entity_id: cadet.id },
      orderBy: { created_at: "desc" },
      include: { user: true }
    });

    res.json({
      audit: logs.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entity_id,
        before: log.before_json ?? null,
        after: log.after_json ?? null,
        createdAt: log.created_at.toISOString(),
        user: formatUser(log.user)
      }))
    });
  } catch (error) {
    next(error);
  }
});

export { router as cadetsRouter };
