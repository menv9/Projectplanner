-- AlterTable
ALTER TABLE "Task" ADD COLUMN "attention" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_attention_idx" ON "Task"("attention");
