-- AlterTable
ALTER TABLE "Cadet" ADD COLUMN "user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "Cadet_user_id_key" ON "Cadet"("user_id");

-- AddForeignKey
ALTER TABLE "Cadet" ADD CONSTRAINT "Cadet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
