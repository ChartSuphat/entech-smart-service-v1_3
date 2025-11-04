-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'technician', 'user');

-- CreateEnum
CREATE TYPE "FormatType" AS ENUM ('draft', 'official');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('pending', 'approved');

-- CreateEnum
CREATE TYPE "InstrumentDescription" AS ENUM ('Gas Detector', 'Gas Analyzer');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "verifyToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "avatar" TEXT,
    "signature" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyNameTH" TEXT,
    "address" TEXT NOT NULL,
    "addressTH" TEXT,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "formatType" "FormatType" NOT NULL DEFAULT 'official',
    "status" "CertificateStatus" NOT NULL DEFAULT 'pending',
    "dateOfIssue" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfCalibration" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "remarks" TEXT,
    "equipmentId" TEXT NOT NULL,
    "probeId" TEXT NOT NULL,
    "toolId" INTEGER,
    "customerId" TEXT NOT NULL,
    "technicianName" TEXT NOT NULL,
    "technicianSignature" TEXT,
    "approverName" TEXT NOT NULL DEFAULT 'Pongpat Keiwamphon',
    "approverSignature" TEXT,
    "calibrationPlace" TEXT NOT NULL,
    "procedureNo" TEXT NOT NULL,
    "ambientConditions" JSONB NOT NULL DEFAULT '{"flowRate": 1000, "humidity": 55.0, "pressure": 1013.4, "gasPressure": 1023.5, "temperature": 25.0, "gasTemperature": 30.5}',
    "hasAdjustment" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hasWatermark" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_data" (
    "id" SERIAL NOT NULL,
    "certificateId" INTEGER NOT NULL,
    "gasType" TEXT NOT NULL,
    "standardValue" DOUBLE PRECISION NOT NULL,
    "measurement1" DOUBLE PRECISION NOT NULL,
    "measurement2" DOUBLE PRECISION NOT NULL,
    "measurement3" DOUBLE PRECISION NOT NULL,
    "resolution" DOUBLE PRECISION NOT NULL,
    "uncertaintyStandard" DOUBLE PRECISION NOT NULL,
    "meanValue" DOUBLE PRECISION,
    "error" DOUBLE PRECISION,
    "repeatability" DOUBLE PRECISION,
    "combinedUncertainty" DOUBLE PRECISION,
    "expandedUncertainty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calibration_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adjusted_calibration_data" (
    "id" SERIAL NOT NULL,
    "certificateId" INTEGER NOT NULL,
    "gasType" TEXT NOT NULL,
    "standardValue" DOUBLE PRECISION NOT NULL,
    "measurement1" DOUBLE PRECISION NOT NULL,
    "measurement2" DOUBLE PRECISION NOT NULL,
    "measurement3" DOUBLE PRECISION NOT NULL,
    "resolution" DOUBLE PRECISION NOT NULL,
    "uncertaintyStandard" DOUBLE PRECISION NOT NULL,
    "meanValue" DOUBLE PRECISION,
    "error" DOUBLE PRECISION,
    "repeatability" DOUBLE PRECISION,
    "combinedUncertainty" DOUBLE PRECISION,
    "expandedUncertainty" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "adjusted_calibration_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tools_management" (
    "id" SERIAL NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "gasName" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "concentration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uncertaintyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uncertaintyStandard" DOUBLE PRECISION,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "certFile" TEXT,
    "toolImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tools_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gas_cylinder_management" (
    "id" SERIAL NOT NULL,
    "itemNumber" TEXT NOT NULL,
    "chemicalFormula" TEXT NOT NULL,
    "gasName" TEXT NOT NULL,
    "balanceGas" TEXT NOT NULL,
    "orderConcentration" DOUBLE PRECISION NOT NULL,
    "realConcentration" DOUBLE PRECISION NOT NULL,
    "materialCode" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "expiredDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL,
    "fullPsi" DOUBLE PRECISION NOT NULL,
    "currentPsi" DOUBLE PRECISION NOT NULL,
    "lv1ThresholdPsi" DOUBLE PRECISION NOT NULL,
    "lv2ThresholdPsi" DOUBLE PRECISION NOT NULL,
    "pricePerPsi" DOUBLE PRECISION NOT NULL,
    "remark" TEXT,
    "toolImageUrl" TEXT,
    "certificateFileUrl" TEXT NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gas_cylinder_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" TEXT NOT NULL,
    "instrumentDescription" "InstrumentDescription" NOT NULL,
    "instrumentModel" TEXT NOT NULL,
    "instrumentSerialNo" TEXT NOT NULL,
    "idNoOrControlNo" TEXT,
    "manufacturer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probes" (
    "id" TEXT NOT NULL,
    "probeDescription" TEXT NOT NULL,
    "probeModel" TEXT NOT NULL,
    "probeSN" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,

    CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "calibrationDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_customerId_key" ON "customers"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNo_key" ON "certificates"("certificateNo");

-- CreateIndex
CREATE INDEX "certificates_certificateNo_idx" ON "certificates"("certificateNo");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "certificates_createdById_idx" ON "certificates"("createdById");

-- CreateIndex
CREATE INDEX "certificates_customerId_idx" ON "certificates"("customerId");

-- CreateIndex
CREATE INDEX "certificates_dateOfCalibration_idx" ON "certificates"("dateOfCalibration");

-- CreateIndex
CREATE INDEX "calibration_data_certificateId_idx" ON "calibration_data"("certificateId");

-- CreateIndex
CREATE INDEX "adjusted_calibration_data_certificateId_idx" ON "adjusted_calibration_data"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "tools_management_certificateNumber_key" ON "tools_management"("certificateNumber");

-- CreateIndex
CREATE INDEX "tools_management_certificateNumber_idx" ON "tools_management"("certificateNumber");

-- CreateIndex
CREATE INDEX "tools_management_dueDate_idx" ON "tools_management"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "gas_cylinder_management_itemNumber_key" ON "gas_cylinder_management"("itemNumber");

-- CreateIndex
CREATE INDEX "gas_cylinder_management_itemNumber_idx" ON "gas_cylinder_management"("itemNumber");

-- CreateIndex
CREATE INDEX "gas_cylinder_management_expiredDate_idx" ON "gas_cylinder_management"("expiredDate");

-- CreateIndex
CREATE INDEX "gas_cylinder_management_isExpired_idx" ON "gas_cylinder_management"("isExpired");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_instrumentSerialNo_key" ON "equipment"("instrumentSerialNo");

-- CreateIndex
CREATE INDEX "equipment_instrumentSerialNo_idx" ON "equipment"("instrumentSerialNo");

-- CreateIndex
CREATE INDEX "equipment_createdById_idx" ON "equipment"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "probes_probeSN_key" ON "probes"("probeSN");

-- CreateIndex
CREATE INDEX "probes_probeSN_idx" ON "probes"("probeSN");

-- CreateIndex
CREATE INDEX "probes_createdById_idx" ON "probes"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "devices_serialNumber_key" ON "devices"("serialNumber");

-- CreateIndex
CREATE INDEX "devices_serialNumber_idx" ON "devices"("serialNumber");

-- CreateIndex
CREATE INDEX "devices_dueDate_idx" ON "devices"("dueDate");

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_probeId_fkey" FOREIGN KEY ("probeId") REFERENCES "probes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools_management"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calibration_data" ADD CONSTRAINT "calibration_data_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjusted_calibration_data" ADD CONSTRAINT "adjusted_calibration_data_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "probes" ADD CONSTRAINT "probes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

