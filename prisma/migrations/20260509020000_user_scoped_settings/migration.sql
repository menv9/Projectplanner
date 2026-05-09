-- Drop old unique indexes
DROP INDEX IF EXISTS "Project_name_key";
DROP INDEX IF EXISTS "Priority_name_key";
DROP INDEX IF EXISTS "Status_name_key";
DROP INDEX IF EXISTS "Category_name_key";

-- Add ownerId columns
ALTER TABLE "Priority" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Status" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Category" ADD COLUMN "ownerId" TEXT;

-- Assign existing data to the first user (or a default admin)
DO $$
DECLARE
  first_user_id TEXT;
BEGIN
  SELECT id INTO first_user_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;
  
  IF first_user_id IS NOT NULL THEN
    UPDATE "Priority" SET "ownerId" = first_user_id WHERE "ownerId" IS NULL;
    UPDATE "Status" SET "ownerId" = first_user_id WHERE "ownerId" IS NULL;
    UPDATE "Category" SET "ownerId" = first_user_id WHERE "ownerId" IS NULL;
  END IF;
END $$;

-- Make ownerId NOT NULL
ALTER TABLE "Priority" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Status" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "ownerId" SET NOT NULL;

-- Add composite unique constraints
CREATE UNIQUE INDEX "Project_name_ownerId_key" ON "Project"("name", "ownerId");
CREATE UNIQUE INDEX "Priority_name_ownerId_key" ON "Priority"("name", "ownerId");
CREATE UNIQUE INDEX "Status_name_ownerId_key" ON "Status"("name", "ownerId");
CREATE UNIQUE INDEX "Category_name_ownerId_key" ON "Category"("name", "ownerId");

-- Add foreign keys
ALTER TABLE "Priority" ADD CONSTRAINT "Priority_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Status" ADD CONSTRAINT "Status_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Category" ADD CONSTRAINT "Category_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "Priority_ownerId_idx" ON "Priority"("ownerId");
CREATE INDEX "Status_ownerId_idx" ON "Status"("ownerId");
CREATE INDEX "Category_ownerId_idx" ON "Category"("ownerId");
