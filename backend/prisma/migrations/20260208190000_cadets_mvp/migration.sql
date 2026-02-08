-- CreateEnum
CREATE TYPE "RecruitmentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REFUSED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('ACQUIRED', 'NOT_ACQUIRED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SIGN');

-- CreateTable
CREATE TABLE "Cadet" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "cadet_number" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cadet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recruitment" (
    "id" UUID NOT NULL,
    "cadet_id" UUID NOT NULL,
    "questionnaire_spreadsheet_url" TEXT,
    "questionnaire_answers_json" JSONB,
    "questionnaire_comment" TEXT,
    "questionnaire_status" "RecruitmentStatus" NOT NULL DEFAULT 'PENDING',
    "questionnaire_signed_by_user_id" UUID,
    "questionnaire_signed_at" TIMESTAMP(3),
    "sport_comment" TEXT,
    "sport_time_minutes" INTEGER,
    "sport_status" "RecruitmentStatus" NOT NULL DEFAULT 'PENDING',
    "sport_signed_by_user_id" UUID,
    "sport_signed_at" TIMESTAMP(3),
    "medical_comment" TEXT,
    "medical_status" "RecruitmentStatus" NOT NULL DEFAULT 'PENDING',
    "medical_signed_by_user_id" UUID,
    "medical_signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recruitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" UUID NOT NULL,
    "cadet_id" UUID NOT NULL,
    "module_number" INTEGER NOT NULL,
    "comment" TEXT,
    "rating_1_10" INTEGER,
    "attendance" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "signed_by_user_id" UUID,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" UUID NOT NULL,
    "cadet_id" UUID NOT NULL,
    "weekly_average" DOUBLE PRECISION,
    "general_comment" TEXT,
    "written_test_score" DOUBLE PRECISION,
    "scenario_score" DOUBLE PRECISION,
    "total_score" DOUBLE PRECISION,
    "ppa" "EvaluationStatus" NOT NULL DEFAULT 'NOT_ACQUIRED',
    "training" "EvaluationStatus" NOT NULL DEFAULT 'NOT_ACQUIRED',
    "signed_by_user_id" UUID,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" UUID NOT NULL,
    "content_text" TEXT NOT NULL,
    "updated_by_user_id" UUID,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cadet_cadet_number_key" ON "Cadet"("cadet_number");

-- CreateIndex
CREATE UNIQUE INDEX "Recruitment_cadet_id_key" ON "Recruitment"("cadet_id");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingModule_cadet_id_module_number_key" ON "TrainingModule"("cadet_id", "module_number");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_cadet_id_key" ON "Evaluation"("cadet_id");

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_cadet_id_fkey" FOREIGN KEY ("cadet_id") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_questionnaire_signed_by_user_id_fkey" FOREIGN KEY ("questionnaire_signed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_sport_signed_by_user_id_fkey" FOREIGN KEY ("sport_signed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recruitment" ADD CONSTRAINT "Recruitment_medical_signed_by_user_id_fkey" FOREIGN KEY ("medical_signed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_cadet_id_fkey" FOREIGN KEY ("cadet_id") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingModule" ADD CONSTRAINT "TrainingModule_signed_by_user_id_fkey" FOREIGN KEY ("signed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_cadet_id_fkey" FOREIGN KEY ("cadet_id") REFERENCES "Cadet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_signed_by_user_id_fkey" FOREIGN KEY ("signed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
