/*
  Warnings:

  - A unique constraint covering the columns `[instrumentSerialNo]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "equipment_instrumentSerialNo_key" ON "equipment"("instrumentSerialNo");
