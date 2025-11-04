import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

// Check cylinders that are near expiry (within 30 days)
export const checkNearExpiryCylinders = async () => {
  const now = new Date();
  const thresholdDate = subDays(now, -30);
  return await prisma.gasCylinderManagement.findMany({
    where: {
      expiredDate: {
        lte: thresholdDate
      },
      isExpired: false
    }
  });
};

// Check expired cylinders
export const checkExpiredCylinders = async () => {
  const now = new Date();
  return await prisma.gasCylinderManagement.findMany({
    where: {
      expiredDate: {
        lte: now
      },
      isExpired: false
    }
  });
};

// Check PSI level alarms
export const checkPsiAlarms = async () => {
  const cylinders = await prisma.gasCylinderManagement.findMany();
  return cylinders.filter(c =>
    c.currentPsi <= c.lv2ThresholdPsi || c.currentPsi <= c.lv1ThresholdPsi
  );
};

// Check which cylinders haven’t had their PSI updated in 30 days
export const checkMonthlyPsiUpdate = async () => {
  const thirtyDaysAgo = subDays(new Date(), 30);
  return await prisma.gasCylinderManagement.findMany({
    where: {
      updatedAt: {
        lt: thirtyDaysAgo
      }
    }
  });
};

// Calculate remaining value (pricePerPsi * currentPsi)
export const calculateRemainingValue = async () => {
  const cylinders = await prisma.gasCylinderManagement.findMany();
  return cylinders.map(c => ({
    id: c.id,
    itemNumber: c.itemNumber,
    remainingValue: c.currentPsi * c.pricePerPsi
  }));
};
