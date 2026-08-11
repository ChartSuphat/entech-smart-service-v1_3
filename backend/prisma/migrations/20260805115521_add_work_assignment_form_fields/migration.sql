/*
  Warnings:

  - You are about to drop the column `description` on the `work_assignments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "work_assignments" DROP COLUMN "description",
ADD COLUMN     "appointmentDate" TIMESTAMP(3),
ADD COLUMN     "appointmentPlace" TEXT,
ADD COLUMN     "appointmentTime" TEXT,
ADD COLUMN     "certificateAddressEN" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "overrideEmail" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "receivedBy" TEXT,
ADD COLUMN     "receivingNo" TEXT,
ADD COLUMN     "safetyEquipment" JSONB,
ADD COLUMN     "safetyTraining" BOOLEAN,
ADD COLUMN     "staffCount" INTEGER,
ADD COLUMN     "testDetails" TEXT,
ADD COLUMN     "workDays" INTEGER,
ADD COLUMN     "workplaceType" JSONB;
