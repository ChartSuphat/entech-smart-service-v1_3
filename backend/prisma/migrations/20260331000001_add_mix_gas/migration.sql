-- AlterTable: add isMixGas to tools_management
ALTER TABLE "tools_management" ADD COLUMN "isMixGas" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: mix_gas_components
CREATE TABLE "mix_gas_components" (
    "id" SERIAL NOT NULL,
    "toolId" INTEGER NOT NULL,
    "gasName" TEXT NOT NULL,
    "gasUnit" TEXT NOT NULL DEFAULT 'ppm',
    "concentration" DOUBLE PRECISION NOT NULL,
    "uncertaintyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uncertaintyStandard" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mix_gas_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mix_gas_components_toolId_idx" ON "mix_gas_components"("toolId");

-- AddForeignKey
ALTER TABLE "mix_gas_components" ADD CONSTRAINT "mix_gas_components_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "tools_management"("id") ON DELETE CASCADE ON UPDATE CASCADE;
