import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const USERS_FILE = path.join(ROOT_DIR, 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'accesslens-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const BCRYPT_ROUNDS = 10;
let usersFileInitialization;

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'tpandi412@gmail.com',
  password: 'thanga2401@',
  fullName: 'Admin User',
  role: 'admin',
};

/**
 * Initialize users file with default admin
 */
async function initializeUsersFile() {
  if (!usersFileInitialization) {
    usersFileInitialization = (async () => {
      try {
        await fs.access(USERS_FILE);
        return;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }

      const adminPasswordHash = await bcrypt.hash(DEFAULT_ADMIN.password, BCRYPT_ROUNDS);
      const users = [
        {
          id: crypto.randomUUID(),
          email: DEFAULT_ADMIN.email,
          password_hash: adminPasswordHash,
          full_name: DEFAULT_ADMIN.fullName,
          role: DEFAULT_ADMIN.role,
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      console.log('✓ Created users.json with default admin');
    })();
  }

  try {
    await usersFileInitialization;
  } catch (error) {
    usersFileInitialization = undefined;
    throw error;
  }
}

/**
 * Load all users from file
 */
async function loadUsers() {
  await initializeUsersFile();
  const data = await fs.readFile(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

/**
 * Save users to file
 */
async function saveUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * Generate JWT token
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
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Login user with email and password
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const users = await loadUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (!user.is_active) {
    throw new Error('Account is disabled');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  user.last_login_at = new Date().toISOString();
  await saveUsers(users);

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
 * Register new user
 */
export async function registerUser({ email, password, fullName }) {
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

  const users = await loadUsers();

  // Check if user already exists
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create new user
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    password_hash: passwordHash,
    full_name: fullName,
    role: 'user',
    is_active: true,
    email_verified: false,
    created_at: new Date().toISOString(),
  };

  users.push(newUser);
  await saveUsers(users);

  const { password_hash, ...userData } = newUser;
  return userData;
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const users = await loadUsers();
  const user = users.find(u => u.id === userId);

  if (!user) {
    return null;
  }

  const { password_hash, ...userData } = user;
  return userData;
}

/**
 * Middleware to authenticate requests
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

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

// Initialize users file on startup
initializeUsersFile().catch(console.error);
