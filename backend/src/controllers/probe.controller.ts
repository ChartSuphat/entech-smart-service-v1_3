// controllers/probe.controller.ts - Updated for String probeDescription
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ✅ Create independent probe (no equipment relationship)
export const createProbe = async (req: any, res: Response) => {
  try {
    console.log('🔍 CREATE PROBE DEBUG:');
    console.log('Request user:', req.user);
    console.log('Request body:', req.body);

    const {
      probeDescription,
      probeModel,
      probeSN
    } = req.body;

    // Handle authentication
    let userId: number;
    if (req.user && req.user.id) {
      userId = parseInt(req.user.id);
    } else {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'admin' }
      });
      if (adminUser) {
        userId = adminUser.id;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
    }

    // Validate required fields
    if (!probeDescription || !probeModel || !probeSN) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: probeDescription, probeModel, probeSN'
      });
    }

    // ✅ UPDATED: Validate probe description as string (no more enum restriction)
    if (typeof probeDescription !== 'string' || !probeDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Probe description must be a valid non-empty string'
      });
    }

    // Check if probe serial number exists
    const existingProbe = await prisma.probe.findUnique({
      where: { probeSN }
    });

    if (existingProbe) {
      return res.status(400).json({
        success: false,
        message: 'Probe with this serial number already exists'
      });
    }

    // Create independent probe (no equipment relationship)
    const probe = await prisma.probe.create({
      data: {
        probeDescription: probeDescription.trim(),
        probeModel: probeModel.trim(),
        probeSN: probeSN.trim(),
        createdById: userId
      }
      // ✅ REMOVED: include createdBy - no need to show who created it
    });

    console.log('✅ Probe created successfully:', probe.id);

    res.status(201).json({
      success: true,
      message: 'Probe created successfully',
      data: probe
    });
  } catch (error: any) {
    console.error('❌ Create probe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create probe',
      error: error.message
    });
  }
};

// ✅ Get all probes
export const getAllProbes = async (req: any, res: Response) => {
  try {
    const probes = await prisma.probe.findMany({
      // ✅ REMOVED: include createdBy - no need to show who created it
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: probes
    });
  } catch (error: any) {
    console.error('Get all probes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch probes',
      error: error.message
    });
  }
};

// ✅ Get single probe by ID
export const getProbeById = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    
    const probe = await prisma.probe.findUnique({
      where: { id }
      // ✅ REMOVED: include createdBy - no need to show who created it
    });

    if (!probe) {
      return res.status(404).json({
        success: false,
        message: 'Probe not found'
      });
    }

    res.json({
      success: true,
      data: probe
    });
  } catch (error: any) {
    console.error('Get probe by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch probe',
      error: error.message
    });
  }
};

// ✅ Update probe
export const updateProbe = async (req: any, res: Response) => {
  try {
    console.log('🔍 UPDATE PROBE DEBUG:');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);

    const { id } = req.params;
    const {
      probeDescription,
      probeModel,
      probeSN
    } = req.body;

    const existingProbe = await prisma.probe.findUnique({
      where: { id }
    });

    if (!existingProbe) {
      return res.status(404).json({
        success: false,
        message: 'Probe not found'
      });
    }

    // ✅ UPDATED: Validate probe description as string (if provided)
    if (probeDescription && (typeof probeDescription !== 'string' || !probeDescription.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Probe description must be a valid non-empty string'
      });
    }

    // Check if new serial number already exists (if different from current)
    if (probeSN && probeSN !== existingProbe.probeSN) {
      const duplicateProbe = await prisma.probe.findUnique({
        where: { probeSN }
      });

      if (duplicateProbe) {
        return res.status(400).json({
          success: false,
          message: 'Probe with this serial number already exists'
        });
      }
    }

    const updatedProbe = await prisma.probe.update({
      where: { id },
      data: {
        probeDescription: probeDescription ? probeDescription.trim() : existingProbe.probeDescription,
        probeModel: probeModel ? probeModel.trim() : existingProbe.probeModel,
        probeSN: probeSN ? probeSN.trim() : existingProbe.probeSN
      }
      // ✅ REMOVED: include createdBy - no need to show who created it
    });

    res.json({
      success: true,
      message: 'Probe updated successfully',
      data: updatedProbe
    });
  } catch (error: any) {
    console.error('Update probe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update probe',
      error: error.message
    });
  }
};

// ✅ Delete probe
export const deleteProbe = async (req: any, res: Response) => {
  try {
    console.log('🔍 DELETE PROBE DEBUG:');
    console.log('Request user:', req.user);

    const { id } = req.params;
    
    // Handle missing authentication
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
        message: 'Insufficient permissions to delete probe'
      });
    }

    const probe = await prisma.probe.findUnique({
      where: { id }
    });

    if (!probe) {
      return res.status(404).json({
        success: false,
        message: 'Probe not found'
      });
    }

    await prisma.probe.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Probe deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete probe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete probe',
      error: error.message
    });
  }
};

// ✅ Get probe statistics
export const getProbeStats = async (req: any, res: Response) => {
  try {
    // ✅ UPDATED: Count by actual string values (with spaces)
    const [
      totalProbes,
      catalyticSensors,
      electrochemicalSensors,
      infraredSensors,
      zerconiaSensors,
      otherSensors
    ] = await Promise.all([
      prisma.probe.count(),
      prisma.probe.count({ where: { probeDescription: 'CATALYTIC SENSOR' } }),
      prisma.probe.count({ where: { probeDescription: 'ELECTROCHEMICAL SENSOR' } }),
      prisma.probe.count({ where: { probeDescription: 'INFRARED SENSOR' } }),
      prisma.probe.count({ where: { probeDescription: 'ZERCONIA SENSOR' } }),
      prisma.probe.count({ 
        where: { 
          probeDescription: { 
            notIn: ['CATALYTIC SENSOR', 'ELECTROCHEMICAL SENSOR', 'INFRARED SENSOR', 'ZERCONIA SENSOR'] 
          } 
        } 
      })
    ]);

    res.json({
      success: true,
      data: {
        totalProbes,
        byType: {
          catalyticSensors,
          electrochemicalSensors,
          infraredSensors,
          zerconiaSensors,
          otherSensors // Custom/other sensor types
        }
      }
    });
  } catch (error: any) {
    console.error('Get probe stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch probe statistics',
      error: error.message
    });
  }
};