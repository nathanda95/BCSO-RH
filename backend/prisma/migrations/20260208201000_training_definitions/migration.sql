-- Enable UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "TrainingModuleDefinition" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModuleDefinition_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN "module_definition_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "TrainingModule_cadet_id_module_definition_id_key" ON "TrainingModule"("cadet_id", "module_definition_id");

-- AddForeignKey
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_module_definition_id_fkey" FOREIGN KEY ("module_definition_id") REFERENCES "TrainingModuleDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingModuleDefinition" ADD CONSTRAINT "TrainingModuleDefinition_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default definitions and map existing modules (if any)
WITH defs(module_number, id) AS (
  VALUES
    (1, gen_random_uuid()),
    (2, gen_random_uuid()),
    (3, gen_random_uuid()),
    (4, gen_random_uuid()),
    (5, gen_random_uuid()),
    (6, gen_random_uuid())
),
inserted AS (
  INSERT INTO "TrainingModuleDefinition" ("id", "title", "description", "created_at", "updated_at")
  SELECT id, 'Module ' || module_number, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM defs
  RETURNING id, title
)
UPDATE "TrainingModule" tm
SET module_definition_id = defs.id
FROM defs
WHERE tm.module_number = defs.module_number;

-- Drop old unique constraint
DROP INDEX IF EXISTS "TrainingModule_cadet_id_module_number_key";

-- Remove legacy column
ALTER TABLE "TrainingModule" DROP COLUMN "module_number";

-- Enforce not null after migration
ALTER TABLE "TrainingModule" ALTER COLUMN "module_definition_id" SET NOT NULL;
