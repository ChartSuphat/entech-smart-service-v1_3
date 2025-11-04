// src/routes/dev.routes.ts
import { Router, Request, Response } from 'express';
import { CertificateTemplateService } from '../services/certificate-template.service';

const router = Router();

// Fake data for testing
const FAKE_CERTIFICATE_DATA = {
  certificate: {
    id: 999,
    certificateNo: 'GC-2508406',
    formatType: 'draft',
    status: 'pending',
    dateOfIssue: new Date('2025-08-27'),
    dateOfCalibration: new Date('2025-08-27'),
    // ... rest of your fake data
    equipment: {
      id: 'test-equipment-1',
      instrumentDescription: 'GAS_DETECTOR',
      instrumentModel: 'MX43',
      instrumentSerialNo: '2212424-016',
      idNoOrControlNo: '#02-H2-Detector',
      manufacturer: 'Oldham Co.,Ltd.'
    },
    probe: {
      id: 'test-probe-1',
      probeDescription: 'CATALYTIC SENSOR',
      probeModel: 'OLCT 100',
      probeSN: '2221333'
    },
    customer: {
      id: 'test-customer-1',
      companyName: 'EntechSi Co., Ltd',
      address: '177/121 Soi Ngamwongwan 47 Yaek 48, Toongsangphong, Laksi, Bangkok 10210'
    },
    ambientConditions: {
      temperature: 25.0,
      humidity: 55.0,
      gasTemperature: 30.5,
      flowRate: 1000,
      gasPressure: 1023.5
    }
  },
  company: {
    name: 'ENTECH SI CO.,LTD.',
    address: '177/121 Soi Ngamwongwan 47 Yaek 48, Toongsangphong, Laksri, Bangkok 10210 THAILAND',
    phone: 'Tel: 0-2779-8655',
    email: 'info@entechsi.com'
  },
  calculations: {
    totalPages: 2,
    receivingNo: '1212',
    parameterOfCalibration: 'Gas Calibration Oxygen ( O2 ) 21.00 % Vol 21 ppm',
    conditionOfUUC: 'Used'
  },
  isDraft: true
};

// Template editor route
router.get('/template-editor', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .container { display: flex; height: 100vh; }
        .editor { width: 50%; padding: 10px; }
        .preview { width: 50%; border-left: 1px solid #ccc; }
        iframe { width: 100%; height: 100%; border: none; }
        textarea { width: 100%; height: 70%; font-family: monospace; }
        button { padding: 10px 20px; margin: 10px 0; background: #007bff; color: white; border: none; cursor: pointer; }
        button:hover { background: #0056b3; }
        .a4-info { background: #f8f9fa; padding: 10px; margin: 10px 0; border-left: 4px solid #007bff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="editor">
          <h3>Certificate Template Editor</h3>
          <div class="a4-info">
            <strong>A4 Size:</strong> 210mm x 297mm<br>
            <strong>Current template:</strong> src/template/certificate.hbs
          </div>
          <button onclick="updatePreview()">🔄 Refresh Preview</button>
          <button onclick="downloadPDF()">📄 Download PDF</button>
          <textarea id="template" placeholder="Edit your template here..."></textarea>
        </div>
        <div class="preview">
          <iframe id="preview" src="/dev/test-certificate"></iframe>
        </div>
      </div>
      <script>
        function updatePreview() {
          document.getElementById('preview').src = '/dev/test-certificate?' + Date.now();
        }
        
        function downloadPDF() {
          window.open('/dev/test-certificate-pdf', '_blank');
        }
        
        // Auto-refresh every 2 seconds when editing
        let autoRefresh = false;
        document.getElementById('template').addEventListener('input', () => {
          if (!autoRefresh) {
            autoRefresh = true;
            setTimeout(() => {
              updatePreview();
              autoRefresh = false;
            }, 2000);
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Test certificate HTML route
router.get('/test-certificate', async (req: Request, res: Response) => {
  try {
    const templateService = new CertificateTemplateService();
    templateService.clearTemplateCache(); // Always reload for development
    
    const template = await templateService['getTemplate']('certificate');
    const html = template(FAKE_CERTIFICATE_DATA);
    
    res.send(html);
  } catch (error) {
    console.error('Error generating test certificate:', error);
    res.status(500).send(`<h1>Template Error</h1><pre>${error}</pre>`);
  }
});

// Test certificate PDF route
router.get('/test-certificate-pdf', async (req: Request, res: Response) => {
  try {
    const templateService = new CertificateTemplateService();
    const pdfBuffer = await templateService.generateCertificatePDF(999); // Using fake ID
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="test-certificate.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('PDF generation failed');
  }
});

export default router;