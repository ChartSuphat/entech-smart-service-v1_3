// src/services/user.service.ts - Updated with avatar and signature functions
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 🔹 Get all users
export const getAllUsers = async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      avatar: true,       // ✅ include avatar
      signature: true,    // ✅ include signature
      createdAt: true,
      updatedAt: true,
    },
  });
};

// 🔹 Get single user by ID
export const getUserById = async (id: number) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        avatar: true,       // ✅ include avatar
        signature: true,    // ✅ include signature
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('📦 getUserById result:', user);
    return user;
  } catch (error) {
    console.error('❌ getUserById error:', error);
    throw error;
  }
};

// 🔹 Update user status
export const updateUserStatus = async (id: number, isActive: boolean) => {
  return await prisma.user.update({
    where: { id },
    data: { isActive },
  });
};

// 🔹 Delete a user
export const deleteUser = async (id: number) => {
  return await prisma.user.delete({
    where: { id },
  });
};

// 🔥 NEW: Update user avatar
export const updateUserAvatar = async (userId: number, avatarPath: string) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarPath },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        avatar: true,
        signature: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log(`📸 Avatar updated for user ${userId}:`, avatarPath);
    return updatedUser;
  } catch (error) {
    console.error(`❌ Error updating avatar for user ${userId}:`, error);
    throw error;
  }
};

// 🔥 NEW: Update user signature
export const updateUserSignature = async (userId: number, signaturePath: string) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { signature: signaturePath },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        avatar: true,
        signature: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log(`✍️ Signature updated for user ${userId}:`, signaturePath);
    return updatedUser;
  } catch (error) {
    console.error(`❌ Error updating signature for user ${userId}:`, error);
    throw error;
  }
};

// 🔥 NEW: Update both avatar and signature (for profile uploads)
export const updateUserProfile = async (userId: number, updates: { avatar?: string; signature?: string }) => {
  try {
    const updateData: any = {};
    
    if (updates.avatar) {
      updateData.avatar = updates.avatar;
    }
    
    if (updates.signature) {
      updateData.signature = updates.signature;
    }
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No updates provided');
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        avatar: true,
        signature: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log(`👤 Profile updated for user ${userId}:`, Object.keys(updateData));
    return updatedUser;
  } catch (error) {
    console.error(`❌ Error updating profile for user ${userId}:`, error);
    throw error;
  }
};

// 🔥 NEW: Clear user avatar (set to null)
export const clearUserAvatar = async (userId: number) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });
    
    console.log(`🗑️ Avatar cleared for user ${userId}`);
    return updatedUser;
  } catch (error) {
    console.error(`❌ Error clearing avatar for user ${userId}:`, error);
    throw error;
  }
};

// 🔥 NEW: Clear user signature (set to null)
export const clearUserSignature = async (userId: number) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { signature: null },
      select: {
        id: true,
        username: true,
        signature: true,
      },
    });
    
    console.log(`🗑️ Signature cleared for user ${userId}`);
    return updatedUser;
  } catch (error) {
    console.error(`❌ Error clearing signature for user ${userId}:`, error);
    throw error;
  }
};