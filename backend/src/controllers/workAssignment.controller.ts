import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { AuthRequest } from '../middlewares/auth.middleware';
import { WorkAssignmentPDFService } from '../services/workAssignment.service';

const pdfService = new WorkAssignmentPDFService();
const prisma = new PrismaClient();

const readSignatureAsBase64 = (userId: number, sigFilename: string | null): string | null => {
  if (!sigFilename) return null;
  const uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
  const sigDir = path.join(uploadsDir, 'signatures');

  const candidates = [
    path.join(sigDir, sigFilename),
    path.join(sigDir, path.basename(sigFilename)),
    path.join(sigDir, `sig-${userId}-${sigFilename}`),
  ];

  let sigPath: string | null = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { sigPath = c; break; }
  }

  if (!sigPath && fs.existsSync(sigDir)) {
    const files = fs.readdirSync(sigDir)
      .filter(f => f.startsWith(`sig-${userId}-`))
      .sort().reverse();
    if (files.length > 0) sigPath = path.join(sigDir, files[0]);
  }

  if (!sigPath) return null;
  try {
    const buf = fs.readFileSync(sigPath);
    const ext = (path.extname(sigPath).replace('.', '') || 'png').toLowerCase();
    const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : 'image/png';
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
};

const generateDocNo = async (): Promise<string> => {
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);

  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

  const count = await prisma.workAssignment.count({
    where: { createdAt: { gte: startOfYear, lt: endOfYear } }
  });

  const seq = String(count + 1).padStart(4, '0');
  return `CAL${yy}${seq}`;
};

const includeRelations = {
  customer: { select: { id: true, customerId: true, companyName: true, companyNameTH: true } },
  createdBy: { select: { fullName: true } }
};

export const getWorkAssignmentStats = async (req: Request, res: Response) => {
  try {
    const approvedCount = await prisma.workAssignment.count({ where: { status: 'approved' } });
    res.json({ success: true, data: { approved: approvedCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
  }
};

export const getWorkAssignments = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { documentNo: { contains: search as string, mode: 'insensitive' } },
        { receivingNo: { contains: search as string, mode: 'insensitive' } },
        { assignedTo: { contains: search as string, mode: 'insensitive' } },
        { customer: { companyName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const assignments = await prisma.workAssignment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includeRelations
    });

    res.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching work assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch work assignments', error: error.message });
  }
};

export const getWorkAssignmentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parseInt(id) },
      include: includeRelations
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Work assignment not found' });
    }

    res.json({ success: true, data: assignment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch work assignment', error: error.message });
  }
};

export const createWorkAssignment = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.user?.id;

  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const {
    customerId, testDetails, receivingNo, contactName, phone, mobile, overrideEmail,
    certificateAddressEN, safetyEquipment, safetyTraining, workplaceType,
    staffCount, workDays, appointmentDate, appointmentTime, appointmentPlace, notes
  } = req.body;

  if (!customerId) {
    return res.status(400).json({ success: false, message: 'Missing required field: customerId' });
  }

  try {
    const [documentNo, creator] = await Promise.all([
      generateDocNo(),
      prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, signature: true } })
    ]);

    const sigBase64 = readSignatureAsBase64(userId, creator?.signature || null);

    const assignment = await prisma.workAssignment.create({
      data: {
        documentNo,
        receivingNo: receivingNo || null,
        docType: 'work_assignment',
        status: 'newjob',
        customerId,
        contactName: contactName || null,
        phone: phone || null,
        mobile: mobile || null,
        overrideEmail: overrideEmail || null,
        certificateAddressEN: certificateAddressEN || null,
        testDetails: testDetails || null,
        safetyEquipment: safetyEquipment || null,
        safetyTraining: safetyTraining !== undefined ? safetyTraining : null,
        workplaceType: workplaceType || null,
        staffCount: staffCount ? parseInt(staffCount) : null,
        workDays: workDays ? parseInt(workDays) : null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        appointmentTime: appointmentTime || null,
        appointmentPlace: appointmentPlace || null,
        notes: notes || null,
        // Auto-sign ผู้มอบหมายงาน (creator) with base64 signature image
        assignedTo: creator?.fullName || null,
        assignedToSig: sigBase64,
        assignedToSignedAt: new Date(),
        createdById: userId
      },
      include: includeRelations
    });

    res.status(201).json({ success: true, message: 'Work assignment created successfully', data: assignment });
  } catch (error: any) {
    console.error('Error creating work assignment:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Document number already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create work assignment', error: error.message });
  }
};

export const updateWorkAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    customerId, testDetails, receivingNo, contactName, phone, mobile, overrideEmail,
    certificateAddressEN, safetyEquipment, safetyTraining, workplaceType,
    staffCount, workDays, appointmentDate, appointmentTime, appointmentPlace,
    notes, status
  } = req.body;

  try {
    const existing = await prisma.workAssignment.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Work assignment not found' });

    const updateData: any = {};
    if (customerId !== undefined) updateData.customerId = customerId;
    if (receivingNo !== undefined) updateData.receivingNo = receivingNo || null;
    if (contactName !== undefined) updateData.contactName = contactName || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (mobile !== undefined) updateData.mobile = mobile || null;
    if (overrideEmail !== undefined) updateData.overrideEmail = overrideEmail || null;
    if (certificateAddressEN !== undefined) updateData.certificateAddressEN = certificateAddressEN || null;
    if (testDetails !== undefined) updateData.testDetails = testDetails || null;
    if (safetyEquipment !== undefined) updateData.safetyEquipment = safetyEquipment;
    if (safetyTraining !== undefined) updateData.safetyTraining = safetyTraining;
    if (workplaceType !== undefined) updateData.workplaceType = workplaceType;
    if (staffCount !== undefined) updateData.staffCount = staffCount ? parseInt(staffCount) : null;
    if (workDays !== undefined) updateData.workDays = workDays ? parseInt(workDays) : null;
    if (appointmentDate !== undefined) updateData.appointmentDate = appointmentDate ? new Date(appointmentDate) : null;
    if (appointmentTime !== undefined) updateData.appointmentTime = appointmentTime || null;
    if (appointmentPlace !== undefined) updateData.appointmentPlace = appointmentPlace || null;
    if (notes !== undefined) updateData.notes = notes || null;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.workAssignment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: includeRelations
    });

    res.json({ success: true, message: 'Work assignment updated successfully', data: updated });
  } catch (error: any) {
    console.error('Error updating work assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to update work assignment', error: error.message });
  }
};

export const deleteWorkAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.workAssignment.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Work assignment not found' });

    await prisma.workAssignment.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, message: 'Work assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting work assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete work assignment', error: error.message });
  }
};

export const generateWorkAssignmentPDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true, createdBy: { select: { fullName: true } } }
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Work assignment not found' });
    }

    const pdfBuffer = await pdfService.generatePDF(assignment);
    const base64PDF = pdfBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        pdf: base64PDF,
        filename: `WorkAssignment_${assignment.documentNo}.pdf`,
        mimeType: 'application/pdf'
      }
    });
  } catch (error: any) {
    console.error('Error generating work assignment PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
  }
};

export const signWorkAssignment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, signature, name, signedDate } = req.body;

  if (!['assignedTo', 'reviewedBy', 'receivedBy'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const existing = await prisma.workAssignment.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Work assignment not found' });

    const sigDate = signedDate ? new Date(signedDate) : new Date();
    const updateData: any = {};

    if (role === 'assignedTo') {
      updateData.assignedTo = name;
      updateData.assignedToSig = signature;
      updateData.assignedToSignedAt = sigDate;
    } else if (role === 'reviewedBy') {
      updateData.reviewedBy = name;
      updateData.reviewedBySig = signature;
      updateData.reviewedBySignedAt = sigDate;
      updateData.status = 'approved';
    } else if (role === 'receivedBy') {
      updateData.receivedBy = name;
      updateData.receivedBySig = signature;
      updateData.receivedBySignedAt = sigDate;
      updateData.status = 'inprogress';
    }

    const updated = await prisma.workAssignment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: includeRelations
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error signing work assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to sign', error: error.message });
  }
};

export const previewWorkAssignmentPDF = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const assignment = await prisma.workAssignment.findUnique({
      where: { id: parseInt(id) },
      include: { customer: true, createdBy: { select: { fullName: true } } }
    });

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Work assignment not found' });
    }

    const pdfBuffer = await pdfService.generatePDF(assignment);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="WorkAssignment_${assignment.documentNo}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating work assignment preview:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF preview', error: error.message });
  }
};
