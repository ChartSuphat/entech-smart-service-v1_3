import { PrismaClient } from '@prisma/client';
import { subMonths, isBefore } from 'date-fns';
import { Request, Response } from 'express';


const prisma = new PrismaClient();

/////// CHECK PSI ALARMS ///////
export const checkPsiAlarms = async () => {
  const cylinders = await prisma.gasCylinderManagement.findMany({
    where: { isExpired: false }
  });

  const lv1Alarms = [];
  const lv2Alarms = [];

  for (const cylinder of cylinders) {
    if (cylinder.currentPsi <= cylinder.lv2ThresholdPsi) {
      lv2Alarms.push(cylinder);
    } else if (cylinder.currentPsi <= cylinder.lv1ThresholdPsi) {
      lv1Alarms.push(cylinder);
    }
  }

  return { lv1Alarms, lv2Alarms };
};

///////  CHECK EXPIRED ///////
export const checkExpiredCylinders = async () => {
  const today = new Date();

  const expired = await prisma.gasCylinderManagement.findMany({
    where: {
      expiredDate: { lt: today },
      isExpired: false
    }
  });

  return expired;
};

/////// CHECK NEAR EXPIRY (2 months before) ///////
export const checkNearExpiryCylinders = async () => {
  const today = new Date();
  const twoMonthsLater = subMonths(today, -2);

  const nearExpiry = await prisma.gasCylinderManagement.findMany({
    where: {
      expiredDate: {
        gt: today,
        lte: twoMonthsLater
      },
      isExpired: false
    }
  });

  return nearExpiry;
};

/////// MONTHLY CHECK REMINDER ///////
export const checkMonthlyPsiUpdate = async () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const cylinders = await prisma.gasCylinderManagement.findMany({
    where: { isExpired: false }
  });

  const needsUpdate = cylinders.filter((cylinder: any) =>
    isBefore(new Date(cylinder.updatedAt), startOfMonth)
  );

  return needsUpdate;
};

/////// COST CALCULATION ///////
export const calculateRemainingValue = async () => {
  const cylinders = await prisma.gasCylinderManagement.findMany({
    where: { isExpired: false }
  });

  let totalValue = 0;

  const valuePerCylinder = cylinders.map((cylinder : any) => {
    const remainingValue = cylinder.currentPsi * cylinder.pricePerPsi;
    totalValue += remainingValue;

    return {
      cylinderId: cylinder.id,
      gasName: cylinder.gasName,
      currentPsi: cylinder.currentPsi,
      remainingValue: remainingValue
    };
  });

  return { totalValue, valuePerCylinder };
};

/////// --------------- CONTROLLERS for ROUTES --------------- ///////

export const getPsiAlarms = async (req: Request, res: Response) => {
  try {
    const result = await checkPsiAlarms();
    res.json(result);
  } catch (error) {
    console.error('Error in getPsiAlarms:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getExpiredCylinders = async (req: Request, res: Response) => {
  try {
    const result = await checkExpiredCylinders();
    res.json(result);
  } catch (error) {
    console.error('Error in getExpiredCylinders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getNearExpiryCylinders = async (req: Request, res: Response) => {
  try {
    const result = await checkNearExpiryCylinders();
    res.json(result);
  } catch (error) {
    console.error('Error in getNearExpiryCylinders:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getMonthlyCheckReminder = async (req: Request, res: Response) => {
  try {
    const result = await checkMonthlyPsiUpdate();
    res.json(result);
  } catch (error) {
    console.error('Error in getMonthlyCheckReminder:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getRemainingValue = async (req: Request, res: Response) => {
  try {
    const result = await calculateRemainingValue();
    res.json(result);
  } catch (error) {
    console.error('Error in getRemainingValue:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


