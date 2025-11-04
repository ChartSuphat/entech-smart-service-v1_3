-- DropIndex
DROP INDEX "equipment_instrumentSerialNo_key";

-- DropIndex
DROP INDEX "probes_probeSN_key";

-- AlterTable
ALTER TABLE "probes" ADD COLUMN     "idNoOrControlNo" TEXT;
