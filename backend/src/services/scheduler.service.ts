import cron from 'node-cron';
import {
  checkExpiredCylinders,
  checkPsiAlarms,
  checkMonthlyPsiUpdate,
  checkNearExpiryCylinders
} from './gasCylinder.service';

// Example notification method (replace with actual email or log system)
const notify = (title: string, items: any[]) => {
  if (items.length > 0) {
    console.log(`\n📢 ${title}`);
    items.forEach(item => {
      console.log(`- Cylinder ${item.itemNumber}`);
    });
  }
};

// Schedule daily job at 9AM
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Running daily gas cylinder safety check...');

  const expired = await checkExpiredCylinders();
  const nearExpiry = await checkNearExpiryCylinders();
  const psiAlerts = await checkPsiAlarms();
  const overdueCheck = await checkMonthlyPsiUpdate();

  notify('❌ Expired Cylinders', expired);
  notify('⚠️ Near Expiry Cylinders (30 days)', nearExpiry);
  notify('🔻 PSI Level Warnings', psiAlerts);
  notify('📝 Cylinders Needing Monthly PSI Update', overdueCheck);

  console.log('✅ Daily check completed.');
});
