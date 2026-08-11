-- CreateEnum
CREATE TYPE "WorkAssignDocType" AS ENUM ('work_assignment', 'request_review');

-- CreateEnum
CREATE TYPE "WorkAssignStatus" AS ENUM ('draft', 'in_progress', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "work_assignments" (
    "id" SERIAL NOT NULL,
    "documentNo" TEXT NOT NULL,
    "docType" "WorkAssignDocType" NOT NULL DEFAULT 'work_assignment',
    "status" "WorkAssignStatus" NOT NULL DEFAULT 'draft',
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedTo" TEXT,
    "reviewedBy" TEXT,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_assignments_documentNo_key" ON "work_assignments"("documentNo");

-- CreateIndex
CREATE INDEX "work_assignments_documentNo_idx" ON "work_assignments"("documentNo");

-- CreateIndex
CREATE INDEX "work_assignments_status_idx" ON "work_assignments"("status");

-- CreateIndex
CREATE INDEX "work_assignments_customerId_idx" ON "work_assignments"("customerId");

-- CreateIndex
CREATE INDEX "work_assignments_docType_idx" ON "work_assignments"("docType");

-- AddForeignKey
ALTER TABLE "work_assignments" ADD CONSTRAINT "work_assignments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_assignments" ADD CONSTRAINT "work_assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
