-- AlterTable
ALTER TABLE "Recruitment"
  RENAME COLUMN "questionnaire_answers_json" TO "questionnaire_answers_text";

-- AlterTable
ALTER TABLE "Recruitment"
  ALTER COLUMN "questionnaire_answers_text" TYPE TEXT
  USING "questionnaire_answers_text"::text;
