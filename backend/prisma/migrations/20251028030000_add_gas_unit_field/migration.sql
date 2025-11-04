-- AlterTable
ALTER TABLE "adjusted_calibration_data" ADD COLUMN     "gasUnit" TEXT NOT NULL DEFAULT 'ppm';

-- AlterTable
ALTER TABLE "calibration_data" ADD COLUMN     "gasUnit" TEXT NOT NULL DEFAULT 'ppm';

-- AlterTable
ALTER TABLE "tools_management" ADD COLUMN     "gasUnit" TEXT NOT NULL DEFAULT 'ppm';
