import express from 'express';
import { printPdfToPrinter, listPrinters } from '../controllers/printer.controller';

const router = express.Router();

router.post('/print', printPdfToPrinter);
router.get('/printers', listPrinters);

export default router;
