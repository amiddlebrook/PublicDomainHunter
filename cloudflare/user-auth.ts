/**
 * User authentication functions for Cloudflare Worker
 * Handles registration, login, and user management using KV storage
 */

export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName?: string;
  isActive: boolean;
  isSuperuser: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Hash a password using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  return { valid: true, message: 'Password is valid' };
}

/**
 * Generate a unique user ID
 */
export async function generateUserId(): Promise<string> {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get user by email
 */
export async function getUserByEmail(kv: KVNamespace, email: string): Promise<User | null> {
  const userData = await kv.get(`user:email:${email.toLowerCase()}`, 'text');
  if (!userData) {
    return null;
  }
  return JSON.parse(userData);
}

/**
 * Get user by username
 */
export async function getUserByUsername(kv: KVNamespace, username: string): Promise<User | null> {
  const userData = await kv.get(`user:username:${username.toLowerCase()}`, 'text');
  if (!userData) {
    return null;
  }
  return JSON.parse(userData);
}

/**
 * Get user by ID
 */
export async function getUserById(kv: KVNamespace, userId: string): Promise<User | null> {
  const userData = await kv.get(`user:id:${userId}`, 'text');
  if (!userData) {
    return null;
  }
  return JSON.parse(userData);
}

/**
 * Create a new user
 */
export async function createUser(
  kv: KVNamespace,
  email: string,
  username: string,
  password: string,
  fullName?: string
): Promise<User> {
  const userId = await generateUserId();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  const user: User = {
    id: userId,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    passwordHash,
    fullName,
    isActive: true,
    isSuperuser: false,
    createdAt: now,
    updatedAt: now,
  };

  const userData = JSON.stringify(user);

  // Store user by ID, email, and username for different lookup methods
  await Promise.all([
    kv.put(`user:id:${userId}`, userData),
    kv.put(`user:email:${email.toLowerCase()}`, userData),
    kv.put(`user:username:${username.toLowerCase()}`, userData),
  ]);

  return user;
}

/**
 * Update user
 */
export async function updateUser(kv: KVNamespace, user: User): Promise<void> {
  user.updatedAt = Date.now();
  const userData = JSON.stringify(user);

  await Promise.all([
    kv.put(`user:id:${user.id}`, userData),
    kv.put(`user:email:${user.email.toLowerCase()}`, userData),
    kv.put(`user:username:${user.username.toLowerCase()}`, userData),
  ]);
}

/**
 * Authenticate user
 */
export async function authenticateUser(
  kv: KVNamespace,
  usernameOrEmail: string,
  password: string
): Promise<User | null> {
  // Try to find user by username first
  let user = await getUserByUsername(kv, usernameOrEmail);

  // If not found, try email
  if (!user) {
    user = await getUserByEmail(kv, usernameOrEmail);
  }

  if (!user) {
    return null;
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}
