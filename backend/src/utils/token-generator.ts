import crypto from 'crypto';

export const generateToken = (length = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};
