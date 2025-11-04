// services/uploadService.ts - CLEAN & SECURE VERSION
import api from '../utils/axios';

// Response types
interface UploadResponse {
  success: boolean;
  message: string;
  filename: string;
  url: string;
  size: number;
  mimetype?: string;
  userId?: number;
}

interface ProfileUploadResponse {
  success: boolean;
  message: string;
  files: {
    userId: number;
    avatar?: {
      filename: string;
      url: string;
      size: number;
    };
    signature?: {
      filename: string;
      url: string;
      size: number;
    };
  };
}

interface ToolFilesResponse {
  success: boolean;
  message: string;
  files: {
    certFile?: {
      filename: string;
      url: string;
      size: number;
    };
    toolImage?: {
      filename: string;
      url: string;
      size: number;
    };
  };
}

export const uploadService = {
  // ========================================
  // USER FILES (Auth required, userId from token)
  // ========================================

  // Upload avatar
  uploadAvatar: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Avatar uploaded:', response.data);
    return response.data;
  },

  // Upload signature
  uploadSignature: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('signature', file);

    const response = await api.post('/upload/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Signature uploaded:', response.data);
    return response.data;
  },

  // Upload profile files (both avatar and signature)
  uploadProfile: async (avatar?: File, signature?: File): Promise<ProfileUploadResponse> => {
    const formData = new FormData();
    
    if (avatar) formData.append('avatar', avatar);
    if (signature) formData.append('signature', signature);

    if (!avatar && !signature) {
      throw new Error('At least one file (avatar or signature) must be provided');
    }

    const response = await api.post('/upload/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Profile files uploaded:', response.data);
    return response.data;
  },

  // ========================================
  // BUSINESS FILES (Auth required)
  // ========================================

  // Upload certificate
  uploadCertificate: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('certificate', file);

    const response = await api.post('/upload/certificate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Certificate uploaded:', response.data);
    return response.data;
  },

  // Upload tool image
  uploadToolImage: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('toolImage', file);

    const response = await api.post('/upload/tool-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Tool image uploaded:', response.data);
    return response.data;
  },

  // Upload document
  uploadDocument: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('document', file);

    const response = await api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Document uploaded:', response.data);
    return response.data;
  },

  // Upload single file (general purpose)
  uploadSingle: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('File uploaded:', response.data);
    return response.data;
  },

  // Upload tool files (certificate + image)
  uploadToolFiles: async (certFile?: File, toolImage?: File): Promise<ToolFilesResponse> => {
    const formData = new FormData();
    
    if (certFile) formData.append('certFile', certFile);
    if (toolImage) formData.append('toolImage', toolImage);

    if (!certFile && !toolImage) {
      throw new Error('At least one file must be provided');
    }

    const response = await api.post('/upload/tool-files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    console.log('Tool files uploaded:', response.data);
    return response.data;
  },

  // ========================================
  // FILE MANAGEMENT
  // ========================================

  // Get file information
  getFileInfo: async (filename: string) => {
    const response = await api.get(`/upload/info/${filename}`);
    return response.data.data;
  },
};

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Example 1: Upload avatar (userId comes from auth token)
const handleAvatarUpload = async (file: File) => {
  try {
    const result = await uploadService.uploadAvatar(file);
    console.log('Avatar uploaded:', result.url);
    // Backend automatically associates with logged-in user
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Example 2: Upload signature
const handleSignatureUpload = async (file: File) => {
  try {
    const result = await uploadService.uploadSignature(file);
    console.log('Signature uploaded:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Example 3: Upload certificate
const handleCertUpload = async (file: File) => {
  try {
    const result = await uploadService.uploadCertificate(file);
    console.log('Certificate uploaded:', result.url);
    // Save result.url to your database record
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Example 4: Upload both avatar and signature
const handleProfileUpload = async (avatar?: File, signature?: File) => {
  try {
    const result = await uploadService.uploadProfile(avatar, signature);
    console.log('Profile updated:', result.files);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// Example 5: Upload tool files
const handleToolUpload = async (cert: File, image: File) => {
  try {
    const result = await uploadService.uploadToolFiles(cert, image);
    console.log('Tool files:', result.files);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

// React Component Example
const AvatarUploader = () => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadService.uploadAvatar(file);
      console.log('Success:', result.url);
      // Update UI or refetch user data
    } catch (error) {
      console.error('Failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileChange}
      disabled={uploading}
    />
  );
};
*/