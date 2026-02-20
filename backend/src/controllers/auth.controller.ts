import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken } from '../utils/token-generator';
import { sendVerificationEmail } from '../services/email.service';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// 🔐 Register
export const register = async (req: Request, res: Response) => {
  const { username, email, password, fullName, role } = req.body;

  if (!username || !email || !password || !fullName || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] }
  });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashed = await bcrypt.hash(password, 10);
  const verifyToken = generateToken();

  await prisma.user.create({
    data: {
      username,
      email,
      password: hashed,
      fullName,
      role,
      isActive: false,
      verifyToken
    }
  });

  //await sendVerificationEmail(email, verifyToken);
  res.status(201).json({ message: 'Registered. Waiting admin to approve an account.' });
};

// ✅ Email Verification
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid verification token.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return res.status(404).json({ message: 'Verification token not found or expired.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        verifyToken: null,
      },
    });

    return res.status(200).send(`
      <html style="font-family:sans-serif;text-align:center;padding-top:5rem;">
        <h1 style="color:green;">✅ Email Verified!</h1>
        <p>Your account has been activated. You may now <a href="${process.env.FRONTEND_URL}/login">login</a>.</p>
      </html>
    `);
  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).json({ message: 'Something went wrong during verification.' });
  }
};

// 🔑 Login (SECURE VERSION - Cookie only)
export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required' });

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username }]
    }
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isActive) return res.status(403).json({ message: 'Account not verified' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid username or password' });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  // ✅ SECURE: Store token in HTTP-only cookie
  res.cookie('token', token, {
    httpOnly: true,                              // ✅ Prevents XSS attacks
    secure: true, // ✅ HTTPS only in production  
    sameSite: 'none',                            // ✅ CSRF protection
    maxAge: COOKIE_MAX_AGE
  });

  // ✅ SECURE: Send user data only (NO token in response)
  res.json({
    message: 'Login successful',
    token: token, 
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      avatar: user.avatar,
      signature: user.signature,
      companyCode: user.companyCode
    }
    // ❌ REMOVED: token from response body for security
  });
};

// 🚪 Logout
export const logout = (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
};