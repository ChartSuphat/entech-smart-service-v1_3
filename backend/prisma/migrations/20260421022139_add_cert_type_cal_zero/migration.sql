-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "calZeroData" JSONB,
ADD COLUMN     "certType" TEXT DEFAULT 'gas',
ADD COLUMN     "receivingNo" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyCode" TEXT;
