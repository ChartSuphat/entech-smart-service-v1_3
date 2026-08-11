import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

export class WorkAssignmentPDFService {
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  private async getLogoAsBase64(): Promise<string> {
    const possiblePaths = [
      path.join(process.cwd(), '..', 'frontend', 'public', 'Logo.png'),
      path.join(process.cwd(), 'src', 'Logo.png'),
      path.join(process.cwd(), 'public', 'Logo.png'),
    ];
    for (const p of possiblePaths) {
      try {
        const buf = await fs.readFile(p);
        return `data:image/png;base64,${buf.toString('base64')}`;
      } catch {
        continue;
      }
    }
    return '';
  }

  private async getTemplate(name: string = 'workAssignment'): Promise<handlebars.TemplateDelegate> {
    const cached = this.templateCache.get(name);
    if (cached) return cached;

    const templatePath = path.join(__dirname, '..', 'template', `${name}.hbs`);
    const src = await fs.readFile(templatePath, 'utf-8');
    const compiled = handlebars.compile(src);
    this.templateCache.set(name, compiled);
    return compiled;
  }

  async generateHTML(data: any): Promise<string> {
    const templateName = data.docType === 'request_review' ? 'requestReview' : 'workAssignment';
    const template = await this.getTemplate(templateName);
    const logoBase64 = await this.getLogoAsBase64();

    const safety = (data.safetyEquipment as any) || {};
    const workplace = (data.workplaceType as any) || {};

    const safetyTrainingRequired = data.safetyTraining === true;
    const safetyTrainingNotRequired = data.safetyTraining === false;

    // Format appointment date for Thai display
    let appointmentDateFormatted = '';
    if (data.appointmentDate) {
      const d = new Date(data.appointmentDate);
      appointmentDateFormatted = d.toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    const createdAtFormatted = data.createdAt
      ? new Date(data.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    // ── Request Review specific data ──
    const rrEq = (data.workplaceType as any) || {};
    const rrReq = (data.safetyEquipment as any) || {};

    const templateData = {
      documentNo: data.documentNo || '',
      receivingNo: data.receivingNo || '',
      logoBase64,
      createdAtFormatted,
      // RR: brand/equipment (stored in workplaceType)
      rrTesto: !!rrEq.testo, rrISC: !!rrEq.isc, rrMSA: !!rrEq.msa, rrGMI: !!rrEq.gmi,
      rrSKC: !!rrEq.skc, rrGaemet: !!rrEq.gaemet, rrMicronics: !!rrEq.micronics,
      rrGeotech: !!rrEq.geotech, rrAccuplus: !!rrEq.accuplus, rrAiry: !!rrEq.airy,
      rrBrandOther: rrEq.brandOther || '',
      rrModelName: rrEq.modelName || '', rrModelProduct: rrEq.modelProduct || '', rrModelQty: rrEq.modelQty || '',
      rrSensorName: rrEq.sensorName || '', rrSensorProduct: rrEq.sensorProduct || '', rrSensorQty: rrEq.sensorQty || '',
      // RR: สถานะการดำเนินการ
      rrStPickup: !!rrEq.stPickup, rrStPickupRef: rrEq.stPickupRef || '', rrStPickupStatus: rrEq.stPickupStatus || '',
      rrStLocalCheck: !!rrEq.stLocalCheck, rrStForeignCheck: !!rrEq.stForeignCheck,
      rrStCheckRef: rrEq.stCheckRef || '', rrStCheckStatus: rrEq.stCheckStatus || '',
      rrStQuoting: !!rrEq.stQuoting, rrStQuotingRef: rrEq.stQuotingRef || '', rrStQuotingStatus: rrEq.stQuotingStatus || '',
      rrStRepairing: !!rrEq.stRepairing, rrStRepairingRef: rrEq.stRepairingRef || '', rrStRepairingStatus: rrEq.stRepairingStatus || '',
      rrStDelivered: !!rrEq.stDelivered, rrStDeliveredRef: rrEq.stDeliveredRef || '', rrStDeliveredStatus: rrEq.stDeliveredStatus || '',
      // RR: ตรวจสอบก่อนส่งมอบ
      rrCkToolOk: !!rrEq.ckToolOk, rrCkToolBad: !!rrEq.ckToolBad,
      rrCkEquipOk: !!rrEq.ckEquipOk, rrCkEquipBad: !!rrEq.ckEquipBad,
      rrCkCertYes: !!rrEq.ckCertYes, rrCkCertNo: !!rrEq.ckCertNo,
      rrCkReportYes: !!rrEq.ckReportYes, rrCkReportNo: !!rrEq.ckReportNo,
      rrCkSensorYes: !!rrEq.ckSensorYes, rrCkSensorNo: !!rrEq.ckSensorNo,
      rrCkDelivEntech: !!rrEq.ckDelivEntech, rrCkDelivCompany: !!rrEq.ckDelivCompany, rrCkDelivPost: !!rrEq.ckDelivPost,
      rrDelivDate: rrEq.delivDate || '', rrCheckedBy: rrEq.checkedBy || '', rrCheckDate: rrEq.checkDate || '',
      // RR: customer requirements (stored in safetyEquipment)
      rrQuotation: !!rrReq.quotation, rrQuotationNote: rrReq.quotationNote || '',
      rrCalibration: !!rrReq.calibration, rrCalibrationNote: rrReq.calibrationNote || '',
      rrAcceptQuote: !!rrReq.acceptQuote, rrAcceptQuoteNote: rrReq.acceptQuoteNote || '',
      rrVerify: !!rrReq.verify, rrVerifyNote: rrReq.verifyNote || '',
      rrRepair: !!rrReq.repair, rrRepairNote: rrReq.repairNote || '',
      // RR: การทบทวนคำขอ items 1-7
      rrRev11: !!rrReq.rev11, rrRev12: !!rrReq.rev12, rrRev12Text: rrReq.rev12Text || '',
      rrRev13: !!rrReq.rev13, rrRev13ISO: !!rrReq.rev13ISO, rrRev13NoISO: !!rrReq.rev13NoISO, rrRev14: !!rrReq.rev14,
      rrRev21: !!rrReq.rev21, rrRev22: !!rrReq.rev22, rrRev23: !!rrReq.rev23, rrRev23Text: rrReq.rev23Text || '',
      rrRev31Text: rrReq.rev31Text || '', rrRev32Yes: !!rrReq.rev32Yes, rrRev32No: !!rrReq.rev32No,
      rrRev33Yes: !!rrReq.rev33Yes, rrRev33No: !!rrReq.rev33No,
      rrRev41: !!rrReq.rev41, rrRev42: !!rrReq.rev42,
      rrRev51: !!rrReq.rev51, rrRev52: !!rrReq.rev52, rrRev5Reason: rrReq.rev5Reason || '',
      rrRev61: !!rrReq.rev61, rrRev62: !!rrReq.rev62, rrRev6Reason: rrReq.rev6Reason || '',
      rrRev71: !!rrReq.rev71,
      rrRev72: !!rrReq.rev72, rrRev72Reason: rrReq.rev72Reason || '',
      rrRev73: !!rrReq.rev73, rrRev73Items: rrReq.rev73Items || '', rrRev73Agency: rrReq.rev73Agency || '',
      // RR: รายละเอียดการสั่งขาย
      rrSoPO: !!rrReq.soPO, rrSoPONo: rrReq.soPONo || '',
      rrSoQuote: !!rrReq.soQuote, rrSoQuoteNo: rrReq.soQuoteNo || '',
      rrSoSaleOrderNo: rrReq.soSaleOrderNo || '', rrSoPRNo: rrReq.soPRNo || '',

      customerCompany: data.customer?.companyName || data.customerCompany || '',
      contactName: data.contactName || '',
      customerAddress: data.customer?.address || data.customerAddress || '',
      phone: data.phone || data.customer?.phone || '',
      mobile: data.mobile || '',
      contactEmail: data.overrideEmail || data.customer?.email || '',
      certificateAddressEN: data.certificateAddressEN || '',

      testDetails: data.testDetails || '',

      safety: {
        shoes: !!safety.shoes,
        helmet: !!safety.helmet,
        glasses: !!safety.glasses,
        otherText: safety.otherText || '',
      },
      safetyTrainingRequired,
      safetyTrainingNotRequired,

      workplace: {
        indoor: !!workplace.indoor,
        production: !!workplace.production,
        lab: !!workplace.lab,
        indoorOther: workplace.indoorOther || '',
        outdoor: !!workplace.outdoor,
        outdoorPipeline: !!workplace.outdoorPipeline,
        outdoorHazardous: !!workplace.outdoorHazardous,
      },

      staffCount: data.staffCount || '',
      workDays: data.workDays || '',
      appointmentDateFormatted,
      appointmentTime: data.appointmentTime || '',
      appointmentPlace: data.appointmentPlace || '',

      notes: data.notes || '',

      assignedTo: data.assignedTo || '',
      assignedToSig: data.assignedToSig || null,
      assignedToSignedAt: data.assignedToSignedAt
        ? new Date(data.assignedToSignedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,

      reviewedBy: data.reviewedBy || '',
      reviewedBySig: data.reviewedBySig || null,
      reviewedBySignedAt: data.reviewedBySignedAt
        ? new Date(data.reviewedBySignedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,

      receivedBy: data.receivedBy || '',
      receivedBySig: data.receivedBySig || null,
      receivedBySignedAt: data.receivedBySignedAt
        ? new Date(data.receivedBySignedAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
        : null,
    };

    return template(templateData);
  }

  async generatePDF(data: any): Promise<Buffer> {
    const html = await this.generateHTML(data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });

      const pdfResult = await page.pdf({
        format: 'A4',
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        printBackground: true,
      }) as Uint8Array;

      return Buffer.from(pdfResult);
    } finally {
      await browser.close();
    }
  }
}
