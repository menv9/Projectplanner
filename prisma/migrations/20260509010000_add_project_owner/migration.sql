-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "ownerId" TEXT;

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
