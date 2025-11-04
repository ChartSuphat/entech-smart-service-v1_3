/*
  Warnings:

  - A unique constraint covering the columns `[probeSN]` on the table `probes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "probes_probeSN_key" ON "probes"("probeSN");
