// controllers/device.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper function to delete old file
// Helper function to delete old file
const deleteOldFile = (filePath: string | null) => {
  if (!filePath) return;
  
  try {
    // Get the uploads directory from environment or default
    const uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
    
    // Extract just the category and filename from the URL
    // Example: http://localhost:4040/uploads/certificates/file.png -> certificates/file.png
    const urlParts = filePath.split('/uploads/');
    const relativePath = urlParts.length > 1 ? urlParts[1] : filePath.replace(/^\//, '');
    
    const fullPath = path.join(uploadsDir, relativePath);
    
    console.log(`🔍 Attempting to delete: ${fullPath}`);
    
    // Check if file exists before trying to delete
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Deleted old file:', relativePath);
      return true;
    } else {
      console.log('⚠️ File not found at:', fullPath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting old file:', filePath, error);
    return false;
  }
};

/////// Create Device ///////
export const createDevice = async (req: Request, res: Response) => {
  console.log('📥 Received request body:', req.body);
  console.log('📥 Request headers:', req.headers);
  
  const { 
    name,
    model,
    serialNumber,
    manufacturer,
    calibrationDate,
    dueDate,
    certificateUrl
  } = req.body;

  console.log('📝 Extracted fields:', {
    name,
    model,
    serialNumber,
    manufacturer,
    calibrationDate,
    dueDate,
    certificateUrl
  });

  try {
    // Validate required fields
    if (!name || !model || !serialNumber || !manufacturer || !calibrationDate || !dueDate) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, model, serialNumber, manufacturer, calibrationDate, dueDate',
        receivedBody: req.body
      });
    }

    console.log('📝 Creating device with data:', {
      name,
      model,
      serialNumber,
      manufacturer,
      certificateUrl
    });

    const newDevice = await prisma.device.create({
      data: {
        name,
        model,
        serialNumber,
        manufacturer,
        calibrationDate: new Date(calibrationDate),
        dueDate: new Date(dueDate),
        certificateUrl: certificateUrl || null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Device created successfully',
      data: {
        id: newDevice.id,
        name: newDevice.name,
        model: newDevice.model,
        serialNumber: newDevice.serialNumber,
        manufacturer: newDevice.manufacturer,
        calibrationDate: newDevice.calibrationDate.toISOString(),
        dueDate: newDevice.dueDate.toISOString(),
        certificateUrl: newDevice.certificateUrl,
        createdAt: newDevice.createdAt.toISOString(),
        updatedAt: newDevice.updatedAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error creating device:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        message: 'Device with this serial number already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create device', 
      error: error.message 
    });
  }
};

/////// Get All Devices ///////
export const getDevices = async (req: Request, res: Response) => {
  try {
    const devices = await prisma.device.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedDevices = devices.map(device => ({
      id: device.id,
      name: device.name,
      model: device.model,
      serialNumber: device.serialNumber,
      manufacturer: device.manufacturer,
      calibrationDate: device.calibrationDate.toISOString(),
      dueDate: device.dueDate.toISOString(),
      certificateUrl: device.certificateUrl,
      createdAt: device.createdAt.toISOString(),
      updatedAt: device.updatedAt.toISOString()
    }));

    console.log('📋 Returning devices:', formattedDevices.length);

    res.json({
      success: true,
      data: formattedDevices
    });
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch devices', 
      error: error.message 
    });
  }
};

/////// Get Device by ID ///////
export const getDeviceById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const device = await prisma.device.findUnique({
      where: {
        id: parseInt(id)
      }
    });

    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    res.json({
      success: true,
      data: {
        id: device.id,
        name: device.name,
        model: device.model,
        serialNumber: device.serialNumber,
        manufacturer: device.manufacturer,
        calibrationDate: device.calibrationDate.toISOString(),
        dueDate: device.dueDate.toISOString(),
        certificateUrl: device.certificateUrl,
        createdAt: device.createdAt.toISOString(),
        updatedAt: device.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching device:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch device', 
      error: error.message 
    });
  }
};

/////// Update Device ///////
export const updateDevice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    name,
    model,
    serialNumber,
    manufacturer,
    calibrationDate,
    dueDate,
    certificateUrl
  } = req.body;

  try {
    // Check if device exists and get current certificate
    const existingDevice = await prisma.device.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingDevice) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (model !== undefined) updateData.model = model;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (calibrationDate !== undefined) updateData.calibrationDate = new Date(calibrationDate);
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    
    // Handle certificate update with old file deletion
    if (certificateUrl && certificateUrl !== existingDevice.certificateUrl) {
      console.log('🔄 Updating certificate file...');
      console.log('Old:', existingDevice.certificateUrl);
      console.log('New:', certificateUrl);
      
      // Delete old certificate file
      deleteOldFile(existingDevice.certificateUrl);
      
      // Set new certificate
      updateData.certificateUrl = certificateUrl;
    }

    console.log('🔄 Updating device:', {
      id: parseInt(id),
      updateData
    });

    const updatedDevice = await prisma.device.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Device updated successfully',
      data: {
        id: updatedDevice.id,
        name: updatedDevice.name,
        model: updatedDevice.model,
        serialNumber: updatedDevice.serialNumber,
        manufacturer: updatedDevice.manufacturer,
        calibrationDate: updatedDevice.calibrationDate.toISOString(),
        dueDate: updatedDevice.dueDate.toISOString(),
        certificateUrl: updatedDevice.certificateUrl,
        createdAt: updatedDevice.createdAt.toISOString(),
        updatedAt: updatedDevice.updatedAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error updating device:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        message: 'Device with this serial number already exists' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update device', 
      error: error.message 
    });
  }
};

/////// Delete Device ///////
export const deleteDevice = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get device data before deletion to clean up files
    const device = await prisma.device.findUnique({
      where: { id: parseInt(id) }
    });

    if (!device) {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }

    // Delete associated certificate file before deleting the device
    console.log('🗑️ Deleting device and associated files...');
    deleteOldFile(device.certificateUrl);

    // Delete the device from database
    const deletedDevice = await prisma.device.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Device and associated files deleted successfully',
      data: {
        id: deletedDevice.id,
        name: deletedDevice.name,
        serialNumber: deletedDevice.serialNumber
      }
    });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Device not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete device', 
      error: error.message 
    });
  }
};