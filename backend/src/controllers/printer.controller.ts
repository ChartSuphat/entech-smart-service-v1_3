import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Use require() to access all printer methods
const printerLib: any = require('pdf-to-printer');

// 🖨 List all available printers
export const listPrinters = async (req: Request, res: Response) => {
  try {
    const printers = await printerLib.getPrinters();
    res.json({ printers });
  } catch (error) {
    console.error('Failed to list printers:', error);
    res.status(500).json({ message: 'Unable to list printers' });
  }
};

// 🖨 Print PDF file to selected printer
export const printPdfToPrinter = async (req: Request, res: Response) => {
  const { fileName, printerName } = req.body;
  const filePath = path.join(__dirname, `../../uploads/${fileName}`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'PDF file not found' });
  }

  try {
    await printerLib.print(filePath, printerName ? { printer: printerName } : undefined);
    res.json({ message: 'Printing triggered successfully' });
  } catch (error) {
    console.error('Failed to print PDF:', error);
    res.status(500).json({ message: 'Failed to print PDF' });
  }
};
