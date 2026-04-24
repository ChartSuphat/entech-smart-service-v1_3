ALTER TABLE "calibration_data" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT;
ALTER TABLE "calibration_data" ADD COLUMN IF NOT EXISTS "vendor" TEXT;
ALTER TABLE "calibration_data" ADD COLUMN IF NOT EXISTS "certDueDate" TEXT;

ALTER TABLE "adjusted_calibration_data" ADD COLUMN IF NOT EXISTS "referenceNo" TEXT;
ALTER TABLE "adjusted_calibration_data" ADD COLUMN IF NOT EXISTS "vendor" TEXT;
ALTER TABLE "adjusted_calibration_data" ADD COLUMN IF NOT EXISTS "certDueDate" TEXT;
