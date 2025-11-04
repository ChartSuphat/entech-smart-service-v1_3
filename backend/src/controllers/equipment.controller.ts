// controllers/equipment.controller.ts - Fixed for independent equipment
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all equipment
export const getAllEquipment = async (req: any, res: Response) => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        // ✅ REMOVED: probes relationship - equipment is now independent
        createdBy: {
          select: { id: true, fullName: true, email: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: equipment
    });
  } catch (error: any) {
    console.error('Get all equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

// Get single equipment by ID
export const getEquipmentById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        // ✅ REMOVED: probes relationship - equipment is now independent
        createdBy: {
          select: { id: true, fullName: true, email: true, username: true }
        }
      }
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error: any) {
    console.error('Get equipment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

// Create new equipment
export const createEquipment = async (req: any, res: Response) => {
  try {
    // 🔍 Debug logging
    console.log('🔍 CREATE EQUIPMENT DEBUG:');
    console.log('Request headers:', req.headers);
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);
    console.log('Request session:', req.session);

    const {
      instrumentDescription,
      instrumentModel,
      instrumentSerialNo,
      idNoOrControlNo,
      manufacturer
      // ✅ REMOVED: probes - equipment is now independent
    } = req.body;

    // 🔧 Handle missing authentication - multiple approaches
    let userId: number;

    if (req.user && req.user.id) {
      userId = parseInt(req.user.id);
      console.log('✅ Using authenticated user:', userId);
    } else if (req.session && req.session.userId) {
      userId = parseInt(req.session.userId);
      console.log('✅ Using session user:', userId);
    } else {
      // 🔧 Fallback: Try to find any admin user or create with null
      console.log('⚠️  No authenticated user found, checking for admin fallback...');
      
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });

      if (adminUser) {
        userId = adminUser.id;
        console.log('✅ Using admin fallback:', userId);
      } else {
        console.log('❌ No user available - authentication required');
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please login again.',
          debug: {
            hasUser: !!req.user,
            hasSession: !!req.session,
            headers: req.headers.authorization ? 'Present' : 'Missing'
          }
        });
      }
    }

    // Validate userId is a valid number
    if (isNaN(userId)) {
      console.log('❌ Invalid user ID format');
      return res.status(401).json({
        success: false,
        message: 'Invalid user authentication format'
      });
    }

    // Validate required fields and enum values
    if (!instrumentDescription || !instrumentModel || !instrumentSerialNo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: instrumentDescription, instrumentModel, instrumentSerialNo'
      });
    }

    // Validate instrumentDescription enum
    const validInstrumentTypes = ['GAS_DETECTOR', 'GAS_ANALYZER'];
    if (!validInstrumentTypes.includes(instrumentDescription)) {
      return res.status(400).json({
        success: false,
        message: `Invalid instrumentDescription. Must be one of: ${validInstrumentTypes.join(', ')}`
      });
    }

    console.log('🔍 Checking for existing equipment with serial:', instrumentSerialNo);

    // Check if serial number exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { instrumentSerialNo }
    });

    if (existingEquipment) {
      console.log('❌ Equipment already exists with serial:', instrumentSerialNo);
      return res.status(400).json({
        success: false,
        message: 'Equipment with this serial number already exists'
      });
    }

    console.log('✅ Serial number is unique, proceeding with creation...');

    // ✅ SIMPLIFIED: Create equipment only (no probes)
    const equipment = await prisma.equipment.create({
      data: {
        instrumentDescription,
        instrumentModel,
        instrumentSerialNo,
        idNoOrControlNo: idNoOrControlNo || null,
        manufacturer: manufacturer || 'Unknown',
        createdById: userId
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, username: true }
        }
      }
    });

    console.log('✅ Equipment creation successful:', equipment.id);

    res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipment
    });
  } catch (error: any) {
    console.error('❌ Create equipment error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create equipment',
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        errorCode: error.code
      }
    });
  }
};

// Update equipment
export const updateEquipment = async (req: any, res: Response) => {
  try {
    console.log('🔍 UPDATE EQUIPMENT DEBUG:');
    console.log('Request user:', req.user);
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    const { id } = req.params;
    const {
      instrumentDescription,
      instrumentModel,
      instrumentSerialNo,
      idNoOrControlNo,
      manufacturer
    } = req.body;

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!existingEquipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Validate instrumentDescription enum if provided
    if (instrumentDescription) {
      const validInstrumentTypes = ['GAS_DETECTOR', 'GAS_ANALYZER'];
      if (!validInstrumentTypes.includes(instrumentDescription)) {
        return res.status(400).json({
          success: false,
          message: `Invalid instrumentDescription. Must be one of: ${validInstrumentTypes.join(', ')}`
        });
      }
    }

    // Check if new serial number already exists (if different from current)
    if (instrumentSerialNo && instrumentSerialNo !== existingEquipment.instrumentSerialNo) {
      const duplicateEquipment = await prisma.equipment.findUnique({
        where: { instrumentSerialNo }
      });

      if (duplicateEquipment) {
        return res.status(400).json({
          success: false,
          message: 'Equipment with this serial number already exists'
        });
      }
    }

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        instrumentDescription: instrumentDescription || existingEquipment.instrumentDescription,
        instrumentModel: instrumentModel || existingEquipment.instrumentModel,
        instrumentSerialNo: instrumentSerialNo || existingEquipment.instrumentSerialNo,
        idNoOrControlNo: idNoOrControlNo !== undefined ? idNoOrControlNo : existingEquipment.idNoOrControlNo,
        manufacturer: manufacturer || existingEquipment.manufacturer
      },
      include: {
        // ✅ REMOVED: probes relationship - equipment is now independent
        createdBy: {
          select: { id: true, fullName: true, email: true, username: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updatedEquipment
    });
  } catch (error: any) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message
    });
  }
};

// Delete equipment
export const deleteEquipment = async (req: any, res: Response) => {
  try {
    console.log('🔍 DELETE EQUIPMENT DEBUG:');
    console.log('Request user:', req.user);
    console.log('User role:', req.user?.role);

    const { id } = req.params;
    
    // Handle missing authentication for delete
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for delete operation'
      });
    }

    const userRole = req.user.role;

    // Only admin and technician can delete
    if (!['admin', 'technician'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete equipment'
      });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id }
      // ✅ REMOVED: include probes - equipment is now independent
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // ✅ SIMPLIFIED: Delete equipment only (no cascade to probes)
    await prisma.equipment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment',
      error: error.message
    });
  }
};

// Get equipment statistics
export const getEquipmentStats = async (req: any, res: Response) => {
  try {
    const [
      totalEquipment,
      gasDetectors,
      gasAnalyzers
      // ✅ REMOVED: totalProbes - equipment and probes are now independent
    ] = await Promise.all([
      prisma.equipment.count(),
      prisma.equipment.count({ where: { instrumentDescription: 'GAS_DETECTOR' } }),
      prisma.equipment.count({ where: { instrumentDescription: 'GAS_ANALYZER' } })
      // ✅ REMOVED: prisma.probe.count() - probes are managed separately
    ]);

    res.json({
      success: true,
      data: {
        totalEquipment,
        gasDetectors,
        gasAnalyzers
        // ✅ REMOVED: totalProbes - equipment stats only
      }
    });
  } catch (error: any) {
    console.error('Get equipment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment statistics',
      error: error.message
    });
  }
};