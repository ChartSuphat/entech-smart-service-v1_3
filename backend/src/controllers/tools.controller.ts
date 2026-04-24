// controllers/tools.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// ✅ Helper function to delete old file
// ✅ Helper function to delete old file
const deleteOldFile = (filePath: string | null) => {
  if (!filePath) return;
  
  try {
    // Get the uploads directory from environment or default
    const uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
    
    // Remove /uploads/ prefix and any base URL to get just the relative path
    const relativePath = filePath
      .replace(/^https?:\/\/[^/]+/, '') // Remove domain if present
      .replace(/^\/uploads\//, '');      // Remove /uploads/ prefix
    
    const fullPath = path.join(uploadsDir, relativePath);
    
    console.log(`Attempting to delete: ${fullPath}`);
    
    // Check if file exists before trying to delete
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Deleted old file:', relativePath);
      return true;
    } else {
      console.log('⚠️ File not found, cannot delete:', fullPath);
      return false;
    }
  } catch (error) {
    console.error('❌ Error deleting old file:', filePath, error);
    return false;
  }
};

/////// Create Tool ///////
export const createTool = async (req: Request, res: Response) => {
  const {
    certificateNumber,
    gasName,
    gasUnit,
    vendorName,
    concentration,
    uncertaintyPercent,
    uncertaintyStandard,
    dueDate,
    certFile,
    toolImage,
    certFileUrl,
    toolImageUrl,
    isMixGas,
    components   // [{gasName, gasUnit, concentration, uncertaintyPercent, uncertaintyStandard?}]
  } = req.body;

  try {
    if (!certificateNumber || !vendorName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: certificateNumber, vendorName'
      });
    }

    if (isMixGas) {
      if (!Array.isArray(components) || components.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Mixed gas tool requires at least 2 components'
        });
      }
    } else {
      if (!gasName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: gasName'
        });
      }
    }

    const calculatedUncertaintyStandard = uncertaintyStandard ||
      ((concentration || 0) * (uncertaintyPercent || 0)) / 100;

    const finalCertFile = certFileUrl || certFile || null;
    const finalToolImage = toolImageUrl || toolImage || null;

    const newTool = await prisma.toolsManagement.create({
      data: {
        certificateNumber,
        gasName: isMixGas ? 'Mixed Gas' : gasName,
        gasUnit: isMixGas ? 'N/A' : (gasUnit || 'ppm'),
        vendorName,
        concentration: isMixGas ? 0 : (concentration || 0),
        uncertaintyPercent: isMixGas ? 0 : (uncertaintyPercent || 0),
        uncertaintyStandard: isMixGas ? 0 : calculatedUncertaintyStandard,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        isMixGas: isMixGas || false,
        certFile: finalCertFile,
        toolImage: finalToolImage,
        ...(isMixGas && components ? {
          components: {
            create: components.map((c: any) => ({
              gasName: c.gasName,
              gasUnit: c.gasUnit || 'ppm',
              concentration: c.concentration || 0,
              uncertaintyPercent: c.uncertaintyPercent || 0,
              uncertaintyStandard: c.uncertaintyStandard ?? ((c.concentration || 0) * (c.uncertaintyPercent || 0)) / 100
            }))
          }
        } : {})
      },
      include: { components: true }
    });

    res.status(201).json({
      success: true,
      message: 'Tool created successfully',
      data: { ...newTool, dueDate: newTool.dueDate.toISOString(), createdAt: newTool.createdAt.toISOString(), updatedAt: newTool.updatedAt.toISOString() }
    });

  } catch (error: any) {
    console.error('Error creating tool:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Tool with this certificate number already exists'
      });
    }
    res.status(500).json({ success: false, message: 'Failed to create tool', error: error.message });
  }
};

/////// Get All Tools ///////
export const getTools = async (req: Request, res: Response) => {
  try {
    const tools = await prisma.toolsManagement.findMany({
      orderBy: { createdAt: 'desc' },
      include: { components: true }
    });

    const formattedTools = tools.map(tool => ({
      id: tool.id,
      certificateNumber: tool.certificateNumber,
      gasName: tool.gasName,
      gasUnit: tool.gasUnit,
      vendorName: tool.vendorName,
      concentration: tool.concentration,
      uncertaintyPercent: tool.uncertaintyPercent,
      uncertaintyStandard: tool.uncertaintyStandard || 0,
      dueDate: tool.dueDate.toISOString(),
      isBlocked: tool.isBlocked,
      isMixGas: tool.isMixGas,
      components: tool.components,
      certFile: tool.certFile,
      toolImage: tool.toolImage,
      createdAt: tool.createdAt.toISOString(),
      updatedAt: tool.updatedAt.toISOString()
    }));

    console.log('📋 Returning tools with file URLs:', formattedTools.map(t => ({
      id: t.id,
      gasName: t.gasName,
      certFile: t.certFile,
      toolImage: t.toolImage
    })));

    res.json({
      success: true,
      data: formattedTools
    });
  } catch (error: any) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tools', 
      error: error.message 
    });
  }
};

/////// Get Tool by ID ///////
export const getToolById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tool = await prisma.toolsManagement.findUnique({
      where: { id: parseInt(id) },
      include: { components: true }
    });

    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    res.json({
      success: true,
      data: {
        ...tool,
        dueDate: tool.dueDate.toISOString(),
        createdAt: tool.createdAt.toISOString(),
        updatedAt: tool.updatedAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch tool', 
      error: error.message 
    });
  }
};

/////// Update Tool ///////
export const updateTool = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    certificateNumber,
    gasName,
    gasUnit,
    vendorName,
    concentration,
    uncertaintyPercent,
    uncertaintyStandard,
    dueDate,
    certFile,      // ✅ Accept both formats
    toolImage,     // ✅ Accept both formats
    certFileUrl,   // ✅ New format from frontend
    toolImageUrl   // ✅ New format from frontend
  } = req.body;

  try {
    // Check if tool exists and get current file paths
    const existingTool = await prisma.toolsManagement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTool) {
      return res.status(404).json({ 
        success: false,
        message: 'Tool not found' 
      });
    }

    const { isMixGas, components } = req.body;
    const updateData: any = {};

    if (certificateNumber !== undefined) updateData.certificateNumber = certificateNumber;
    if (gasName !== undefined) updateData.gasName = gasName;
    if (gasUnit !== undefined) updateData.gasUnit = gasUnit;
    if (vendorName !== undefined) updateData.vendorName = vendorName;
    if (concentration !== undefined) updateData.concentration = concentration;
    if (uncertaintyPercent !== undefined) updateData.uncertaintyPercent = uncertaintyPercent;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (isMixGas !== undefined) updateData.isMixGas = isMixGas;
    
    // ✅ CRITICAL: Handle file updates with old file deletion
    const finalCertFile = certFileUrl || certFile;
    const finalToolImage = toolImageUrl || toolImage;

    // Delete old certificate file if new one is uploaded
    if (finalCertFile && finalCertFile !== existingTool.certFile) {
      console.log('🔄 Updating certificate file...');
      console.log('Old:', existingTool.certFile);
      console.log('New:', finalCertFile);
      
      // Delete old file
      deleteOldFile(existingTool.certFile);
      
      // Set new file
      updateData.certFile = finalCertFile;
    }

    // Delete old tool image if new one is uploaded
    if (finalToolImage && finalToolImage !== existingTool.toolImage) {
      console.log('🔄 Updating tool image...');
      console.log('Old:', existingTool.toolImage);
      console.log('New:', finalToolImage);
      
      // Delete old file
      deleteOldFile(existingTool.toolImage);
      
      // Set new file
      updateData.toolImage = finalToolImage;
    }

    console.log('🔄 Updating tool with files:', {
      id: parseInt(id),
      certFile: updateData.certFile,
      toolImage: updateData.toolImage
    });

    // Recalculate uncertaintyStandard if needed
    if (concentration !== undefined || uncertaintyPercent !== undefined) {
      const newConcentration = concentration !== undefined ? concentration : existingTool.concentration;
      const newUncertaintyPercent = uncertaintyPercent !== undefined ? uncertaintyPercent : existingTool.uncertaintyPercent;
      updateData.uncertaintyStandard = (newConcentration * newUncertaintyPercent) / 100;
    } else if (uncertaintyStandard !== undefined) {
      updateData.uncertaintyStandard = uncertaintyStandard;
    }

    await prisma.toolsManagement.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Replace components if mix gas and components provided
    if (isMixGas && Array.isArray(components)) {
      await prisma.mixGasComponent.deleteMany({ where: { toolId: parseInt(id) } });
      await prisma.mixGasComponent.createMany({
        data: components.map((c: any) => ({
          toolId: parseInt(id),
          gasName: c.gasName,
          gasUnit: c.gasUnit || 'ppm',
          concentration: c.concentration || 0,
          uncertaintyPercent: c.uncertaintyPercent || 0,
          uncertaintyStandard: c.uncertaintyStandard ?? ((c.concentration || 0) * (c.uncertaintyPercent || 0)) / 100
        }))
      });
    }

    const updatedTool = await prisma.toolsManagement.findUnique({
      where: { id: parseInt(id) },
      include: { components: true }
    });

    res.json({
      success: true,
      message: 'Tool updated successfully',
      data: {
        ...updatedTool,
        dueDate: updatedTool!.dueDate.toISOString(),
        createdAt: updatedTool!.createdAt.toISOString(),
        updatedAt: updatedTool!.updatedAt.toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error updating tool:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        message: 'Tool with this certificate number already exists' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Tool not found' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to update tool', 
      error: error.message 
    });
  }
};

/////// Delete Tool ///////
export const deleteTool = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Get tool data before deletion to clean up files
    const tool = await prisma.toolsManagement.findUnique({
      where: { id: parseInt(id) }
    });

    if (!tool) {
      return res.status(404).json({ 
        success: false,
        message: 'Tool not found' 
      });
    }

    // ✅ Delete associated files before deleting the tool
    console.log('🗑️ Deleting tool and associated files...');
    deleteOldFile(tool.certFile);
    deleteOldFile(tool.toolImage);

    // Delete the tool from database
    const deletedTool = await prisma.toolsManagement.delete({
      where: { id: parseInt(id) }
    });

    res.json({ 
      success: true,
      message: 'Tool and associated files deleted successfully',
      data: {
        id: deletedTool.id,
        certificateNumber: deletedTool.certificateNumber
      }
    });
  } catch (error: any) {
    console.error('Error deleting tool:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false,
        message: 'Tool not found' 
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete tool',
      error: error.message
    });
  }
};

/////// Toggle Block Tool (admin only) ///////
export const toggleBlockTool = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const tool = await prisma.toolsManagement.findUnique({ where: { id: parseInt(id) } });
    if (!tool) {
      return res.status(404).json({ success: false, message: 'Tool not found' });
    }

    const updated = await prisma.toolsManagement.update({
      where: { id: parseInt(id) },
      data: { isBlocked: !tool.isBlocked }
    });

    res.json({
      success: true,
      message: updated.isBlocked ? 'Tool blocked successfully' : 'Tool unblocked successfully',
      data: { id: updated.id, isBlocked: updated.isBlocked }
    });
  } catch (error: any) {
    console.error('Error toggling tool block:', error);
    res.status(500).json({ success: false, message: 'Failed to update tool', error: error.message });
  }
};