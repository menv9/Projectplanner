CREATE TABLE "MutedProject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutedProject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MutedProject_userId_projectId_key" ON "MutedProject"("userId", "projectId");
CREATE INDEX "MutedProject_userId_idx" ON "MutedProject"("userId");

ALTER TABLE "MutedProject" ADD CONSTRAINT "MutedProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MutedProject" ADD CONSTRAINT "MutedProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
