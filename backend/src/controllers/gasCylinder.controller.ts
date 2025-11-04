import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/////// CREATE GAS CYLINDER ///////
export const createGasCylinder = async (req: Request, res: Response) => {
  const {
    itemNumber,
    chemicalFormula,
    gasName,
    balanceGas,
    orderConcentration,
    realConcentration,
    materialCode,
    certificateNumber,
    supplierName,
    storageLocation,
    expiredDate,
    receivedDate,
    fullPsi,
    currentPsi,
    lv1ThresholdPsi,
    lv2ThresholdPsi,
    pricePerPsi,
    remark,
    toolImageUrl,
    certificateFileUrl
  } = req.body;

  try {
    // 1️⃣ Create GasCylinderManagement
    const gasCylinder = await prisma.gasCylinderManagement.create({
      data: {
        itemNumber,
        chemicalFormula,
        gasName,
        balanceGas,
        orderConcentration: parseFloat(orderConcentration),
        realConcentration: parseFloat(realConcentration),
        materialCode,
        certificateNumber,
        supplierName,
        storageLocation,
        expiredDate: new Date(expiredDate),
        receivedDate: new Date(receivedDate),
        fullPsi: parseFloat(fullPsi),
        currentPsi: parseFloat(currentPsi),
        lv1ThresholdPsi: parseFloat(lv1ThresholdPsi),
        lv2ThresholdPsi: parseFloat(lv2ThresholdPsi),
        pricePerPsi: parseFloat(pricePerPsi),
        remark,
        toolImageUrl,
        certificateFileUrl
      }
    });

    // 2️⃣ Auto-create ToolsManagement with NEW schema fields
    await prisma.toolsManagement.create({
      data: {
        certificateNumber: gasCylinder.certificateNumber,  // ✅ Updated field name
        gasName: gasCylinder.gasName,                      // ✅ Updated field name
        vendorName: gasCylinder.supplierName,              // ✅ New required field
        concentration: gasCylinder.realConcentration,      // ✅ New required field
        uncertaintyPercent: 0,                             // ✅ New required field (default)
        uncertaintyStandard: 0,                            // ✅ Optional field
        dueDate: gasCylinder.expiredDate,                  // ✅ New required field
        certFile: gasCylinder.certificateFileUrl,          // ✅ Updated field name
        toolImage: gasCylinder.toolImageUrl                // ✅ Updated field name
      }
    });

    res.status(201).json({ message: 'Gas cylinder created and tool added!' });
  } catch (error: any) {
    console.error('Error creating gas cylinder:', error);
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'Gas cylinder with this certificate number already exists' 
      });
    }
    
    res.status(500).json({ message: 'Failed to create gas cylinder', error: error.message });
  }
};

/////// GET ALL GAS CYLINDERS ///////
export const getGasCylinders = async (req: Request, res: Response) => {
  try {
    const gasCylinders = await prisma.gasCylinderManagement.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    res.json(gasCylinders);
  } catch (error: any) {
    console.error('Error fetching gas cylinders:', error);
    res.status(500).json({ message: 'Failed to fetch gas cylinders', error: error.message });
  }
};