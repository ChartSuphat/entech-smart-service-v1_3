import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import certificateRoutes from './routes/certificate.routes';
import customerRoutes from './routes/customer.routes';
import toolsRoutes from './routes/tools.routes';
import gasCylinderRoutes from './routes/gasCylinder.routes';
import uploadRoutes from './routes/upload.routes';
import './services/scheduler.service';
import printerRoutes from './routes/printer.routes';
import cookieParser from 'cookie-parser';
import deviceRoutes from './routes/device.routes';
import userRoutes from './routes/user.routes';
import equipmentRoutes from './routes/equipment.routes';
import devRoutes from './routes/dev.routes';

// 🔥 LOAD ENVIRONMENT VARIABLES FIRST - Before any other imports
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Backend URL: ${process.env.BACKEND_URL}`);
console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);



const app = express();

const uploadsDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));
console.log('Main uploads directory:', uploadsDir);

// The organized middleware will create all subdirectories automatically
// But ensure the main uploads directory exists for static serving
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created main uploads directory:', uploadsDir);
}


 const allowedOrigins = ['https://entech-online.com', 'http://localhost:5050']//process.env.FRONTEND_URL 
//   ? process.env.FRONTEND_URL
//   : ['http://localhost:5050', 'http://localhost:5174', 'http://localhost:4040'];

 console.log('CORS Allowed Origins:', allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Serve uploaded files statically (now serves organized folders too)
app.use('/uploads', express.static(uploadsDir));

// 🔥 DUAL ROUTING: Support both /api/* and /* patterns
// This allows your frontend to work without changes while maintaining proper API structure

// Primary API routes with /api prefix (best practice)
app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/gas-cylinder', gasCylinderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/devices', deviceRoutes);
// Secondary routes without /api prefix (for frontend compatibility)
app.use('/auth', authRoutes);
app.use('/certificates', certificateRoutes);
app.use('/customers', customerRoutes);
app.use('/tools', toolsRoutes);
app.use('/gas-cylinder', gasCylinderRoutes);
app.use('/upload', uploadRoutes);
app.use('/printer', printerRoutes);
app.use('/users', userRoutes);
app.use('/equipment', equipmentRoutes);
app.use('/devices', deviceRoutes);
// For test my cert layout (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/dev', devRoutes);
}

// Health check (both paths for consistency)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Debug route to list all registered routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/debug/routes', (req, res) => {
    const routes: string[] = [];
    
    app._router.stack.forEach((middleware: any) => {
      if (middleware.route) {
        routes.push(`${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
      } else if (middleware.name === 'router' && middleware.regexp) {
        const routePattern = middleware.regexp.source
          .replace('\\', '')
          .replace('(?=\\/|$)', '')
          .replace('^', '');
        routes.push(`ROUTER ${routePattern}`);
      }
    });
    
    res.json({
      message: 'Registered routes',
      routes: routes,
      equipmentRouteRegistered: routes.some(route => route.includes('equipment')),
      uploadRouteRegistered: routes.some(route => route.includes('upload'))
    });
  });
}

// Unknown route handler
app.use((req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    message: 'Route not found',
    requestedPath: req.path,
    method: req.method
  });
});

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
