import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 10;

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return supabaseClient;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser({ email, password, fullName }) {
  const client = getSupabaseClient();
  
  // Validate input
  if (!email || !password || !fullName) {
    throw new Error('Email, password, and full name are required');
  }
  
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }
  
  // Check if user already exists
  const { data: existing } = await client
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  if (existing) {
    throw new Error('User with this email already exists');
  }
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  // Create user
  const { data: user, error } = await client
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName,
      role: 'user',
      is_active: true,
      email_verified: false,
    })
    .select('id, email, full_name, role, is_active, created_at')
    .single();
  
  if (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
  
  return user;
}

/**
 * Login a user
 */
export async function loginUser({ email, password }) {
  const client = getSupabaseClient();
  
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Get user by email
  const { data: user, error } = await client
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  if (error || !user) {
    throw new Error('Invalid email or password');
  }
  
  // Check if account is active
  if (!user.is_active) {
    throw new Error('Account is disabled');
  }
  
  // Verify password
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login time
  await client
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);
  
  // Generate token
  const token = generateToken(user);
  
  // Return user data (without password hash)
  const { password_hash, ...userData } = user;
  
  return {
    user: userData,
    token,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const client = getSupabaseClient();
  
  const { data: user, error } = await client
    .from('users')
    .select('id, email, full_name, role, is_active, email_verified, created_at, last_login_at')
    .eq('id', userId)
    .single();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const client = getSupabaseClient();
  
  const allowedFields = ['full_name', 'email'];
  const updateData = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No valid fields to update');
  }
  
  const { data: user, error } = await client
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, email, full_name, role, is_active, email_verified')
    .single();
  
  if (error) {
    throw new Error(`Profile update failed: ${error.message}`);
  }
  
  return user;
}

/**
 * Change user password
 */
export async function changePassword(userId, oldPassword, newPassword) {
  const client = getSupabaseClient();
  
  if (newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long');
  }
  
  // Get current user
  const { data: user } = await client
    .from('users')
    .select('password_hash')
    .eq('id', userId)
    .single();
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Verify old password
  const isValid = await verifyPassword(oldPassword, user.password_hash);
  if (!isValid) {
    throw new Error('Current password is incorrect');
  }
  
  // Hash new password
  const newHash = await hashPassword(newPassword);
  
  // Update password
  const { error } = await client
    .from('users')
    .update({ password_hash: newHash })
    .eq('id', userId);
  
  if (error) {
    throw new Error(`Password change failed: ${error.message}`);
  }
  
  return true;
}

/**
 * Middleware to authenticate requests
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
  
  req.user = decoded;
  next();
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
