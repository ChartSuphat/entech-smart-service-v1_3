import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { uploadService } from '../services/uploadService';
import api from '../utils/axios';


interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  signature?: string;
  avatarUrl?: string;
  signatureUrl?: string;
}

const SettingsPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [signaturePreview, setSignaturePreview] = useState('');

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [originalFullName, setOriginalFullName] = useState('');

  // Track if any changes were made
  const [hasChanges, setHasChanges] = useState(false);

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadUserProfile();
    loadTheme();
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      loadTheme();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        loadTheme();
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(loadTheme, 1000);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const nameChanged = fullName !== originalFullName;
    const hasNewAvatar = avatarFile !== null;
    const hasNewSignature = signatureFile !== null;
    const passwordFormFilled = showPasswordForm && currentPassword && newPassword && confirmPassword;

    const anyChanges = nameChanged || hasNewAvatar || hasNewSignature || Boolean(passwordFormFilled);

    setHasChanges(anyChanges);
  }, [
    fullName,
    originalFullName,
    avatarFile?.name,
    signatureFile?.name,
    showPasswordForm,
    currentPassword,
    newPassword,
    confirmPassword,
    user
  ]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');

      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);
        setFullName(userData.fullName || '');
        setOriginalFullName(userData.fullName || '');
        setEmail(userData.email || '');

        console.log("userData.avatar: ", userData.avatar);

        // ✅ Use full backend URL
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4040';

        if (userData.avatar) {
          setAvatarPreview(`/uploads/avatars/${userData.avatar}?t=${Date.now()}`);
        } else {
          setAvatarPreview('');
        }

        if (userData.signature) {
          setSignaturePreview(`/uploads/signatures/${userData.signature}?t=${Date.now()}`);
        } else {
          setSignaturePreview('');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadTheme = () => {
    const storedTheme = localStorage.getItem('theme') || 'light';
    setTheme(storedTheme as 'light' | 'dark');
  };

  const handleFilePreview = (file: File, setPreview: (preview: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);

    if (file) {
      handleFilePreview(file, setAvatarPreview);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSignatureFile(file);

    if (file) {
      handleFilePreview(file, setSignaturePreview);
    }
  };

  const uploadFiles = async (): Promise<{ avatarUrl?: string; signatureUrl?: string }> => {
    const uploadResults: { avatarUrl?: string; signatureUrl?: string } = {};

    try {
      if (avatarFile) {
        console.log('Uploading avatar...');
        const result = await uploadService.uploadAvatar(avatarFile);
        uploadResults.avatarUrl = result.url;
        console.log('Avatar uploaded:', result.url);
      }

      if (signatureFile) {
        console.log('Uploading signature...');
        const result = await uploadService.uploadSignature(signatureFile);
        uploadResults.signatureUrl = result.url;
        console.log('Signature uploaded:', result.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }

    return uploadResults;
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setUploading(true);
      setError(null);

      // Upload files and get URLs
      const uploadResults = await uploadFiles();

      // Build update payload
      const updatePayload: any = {};

      if (fullName !== originalFullName) {
        updatePayload.fullName = fullName;
      }

      if (uploadResults.avatarUrl) {
        const filename = uploadResults.avatarUrl.split('/').pop();
        updatePayload.avatar = filename;
      }

      if (uploadResults.signatureUrl) {
        updatePayload.signature = uploadResults.signatureUrl;
      }

      // Send update to backend if there are changes
      if (Object.keys(updatePayload).length > 0) {
        console.log('Updating profile with:', updatePayload);
        await api.post('/users/profile', updatePayload);
      }

      await loadUserProfile();

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...storedUser,
        fullName: fullName,
        avatar: updatePayload.avatar || storedUser.avatar,
        signature: updatePayload.signature || storedUser.signature
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Dispatch event so Topbar refreshes immediately
      window.dispatchEvent(new CustomEvent('userDataUpdated'));

      // Clear selections
      setAvatarFile(null);
      setSignatureFile(null);
      setIsEditingName(false);
      setHasChanges(false);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to update profile');
      } else {
        setError('Failed to update profile');
      }
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error changing password:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to change password');
      } else {
        setError('Failed to change password');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));

    setSuccess('Theme saved successfully!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className={`text-2xl font-bold mb-6 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'
          }`}>
          Settings
        </h1>

        {/* Success Message */}
        {success && (
          <div className={`mb-6 p-4 border rounded transition-colors ${isDark
            ? 'bg-green-900 border-green-700 text-green-300'
            : 'bg-green-100 border-green-400 text-green-700'
            }`}>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 border rounded transition-colors ${isDark
            ? 'bg-red-900 border-red-700 text-red-300'
            : 'bg-red-100 border-red-400 text-red-700'
            }`}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Profile Section */}
        <div className={`rounded-lg shadow-md p-6 mb-6 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center mb-6">
            <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-800'
              }`}>
              Profile
            </h2>
          </div>

          {/* Profile Picture */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 mb-4 mx-auto transition-colors ${isDark ? 'border-gray-600' : 'border-gray-200'
                }`}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarPreview('')}
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center transition-colors ${isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}>
                    <span className={`text-4xl transition-colors ${isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>👤</span>
                  </div>
                )}
              </div>

              {avatarFile && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  New
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="avatar-upload"
                disabled={uploading}
              />
              <label
                htmlFor="avatar-upload"
                className={`inline-block px-4 py-2 text-white rounded cursor-pointer transition-colors ${uploading
                  ? 'opacity-50 cursor-not-allowed bg-blue-400'
                  : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Change Profile Picture
              </label>
            </div>

            {avatarFile && (
              <p className="text-sm text-green-600 mt-2">
                New file: {avatarFile.name}
              </p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Full Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${!isEditingName
                    ? isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-100 border-gray-300 text-gray-900 cursor-not-allowed'
                    : isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  disabled={!isEditingName || saving}
                  readOnly={!isEditingName}
                />
                <button
                  className={`px-3 py-2 text-sm font-medium transition-colors ${isDark
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-800'
                    }`}
                  onClick={() => {
                    if (isEditingName) {
                      setFullName(originalFullName);
                      setIsEditingName(false);
                    } else {
                      setIsEditingName(true);
                    }
                  }}
                >
                  {isEditingName ? 'Cancel' : 'Change Name'}
                </button>
              </div>
              {isEditingName && (
                <p className={`text-xs mt-1 transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                  You can now edit your name. Click Update Profile to save.
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                className={`w-full px-3 py-2 border rounded-md transition-colors ${isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-gray-100 border-gray-300 text-gray-900'
                  }`}
                disabled
              />
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md transition-colors ${isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-300'
                  : 'bg-gray-100 border-gray-300 text-gray-900'
                  }`}
                disabled
              />
            </div>

            {/* Signature */}
            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Signature
              </label>

              {signaturePreview && !signatureFile && (
                <div className={`mb-3 p-4 border rounded-md transition-colors ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
                  }`}>
                  <p className={`text-sm mb-2 transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    Current Signature:
                  </p>
                  <img
                    src={signaturePreview}
                    alt="Current Signature"
                    className={`max-h-24 border rounded transition-colors ${isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}
                    onError={() => setSignaturePreview('')}
                  />
                </div>
              )}

              {signaturePreview && signatureFile && (
                <div className={`mb-3 p-4 border rounded-md transition-colors ${isDark
                  ? 'border-green-700 bg-green-900/20'
                  : 'border-green-200 bg-green-50'
                  }`}>
                  <p className={`text-sm mb-2 transition-colors ${isDark ? 'text-green-400' : 'text-green-600'
                    }`}>
                    New signature selected:
                  </p>
                  <img
                    src={signaturePreview}
                    alt="Signature Preview"
                    className={`max-h-24 border rounded transition-colors ${isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}
                  />
                </div>
              )}

              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSignatureChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="signature-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="signature-upload"
                  className={`flex items-center justify-center w-full h-12 px-4 border-2 border-dashed rounded-md cursor-pointer transition-colors ${uploading
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                >
                  <span className={`text-sm transition-colors ${isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    {signatureFile ? `New signature: ${signatureFile.name}` : 'Upload Signature'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className={`rounded-lg shadow-md p-6 mb-6 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center mb-6">
            <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-800'
              }`}>
              Appearance
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
                className="mr-2"
              />
              <span className={`flex items-center transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'
                }`}>
                Light
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark')}
                className="mr-2"
              />
              <span className={`flex items-center transition-colors ${isDark ? 'text-gray-300' : 'text-gray-900'
                }`}>
                Dark
              </span>
            </label>
          </div>

          <button
            onClick={() => handleThemeChange(theme)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Theme
          </button>
        </div>

        {/* Security Section */}
        <div className={`rounded-lg shadow-md p-6 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className="flex items-center mb-6">
            <h2 className={`text-xl font-semibold transition-colors ${isDark ? 'text-gray-100' : 'text-gray-800'
              }`}>
              Security
            </h2>
          </div>

          {!showPasswordForm && (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Change Password
            </button>
          )}

          {showPasswordForm && (
            <div className="space-y-4">
              <p className={`text-sm transition-colors ${isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                Fill in all fields and the Change Password button will appear below.
              </p>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  disabled={saving}
                  placeholder="Enter your current password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  disabled={saving}
                  placeholder="Enter your new password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  disabled={saving}
                  placeholder="Confirm your new password"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Update Profile Button */}
        {hasChanges && (
          <div className="mt-6">
            {showPasswordForm && currentPassword && newPassword && confirmPassword ? (
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="w-full py-3 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {saving ? 'Changing Password...' : 'Change Password'}
              </button>
            ) : (
              <button
                onClick={handleUpdateProfile}
                disabled={saving || uploading}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
              >
                {uploading ? 'Uploading Files...' : (saving ? 'Saving Profile...' : 'Update Profile')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;