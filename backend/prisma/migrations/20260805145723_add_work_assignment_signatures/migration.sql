-- AlterTable
ALTER TABLE "work_assignments" ADD COLUMN     "assignedToSig" TEXT,
ADD COLUMN     "assignedToSignedAt" TIMESTAMP(3),
ADD COLUMN     "receivedBySig" TEXT,
ADD COLUMN     "receivedBySignedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBySig" TEXT,
ADD COLUMN     "reviewedBySignedAt" TIMESTAMP(3);
