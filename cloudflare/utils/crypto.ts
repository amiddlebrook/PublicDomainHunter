// cloudflare/utils/crypto.ts
// Password hashing and verification utilities for Cloudflare Workers
// Uses Web Crypto API (native to Workers runtime)

/**
 * Hashes a password using PBKDF2 with a random salt
 * @param password - The plain text password to hash
 * @returns A string in the format: salt:iterations:hash
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  // Use PBKDF2 to derive a key
  const iterations = 100000;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');

  // Return salt:iterations:hash format
  return `${saltHex}:${iterations}:${hashHex}`;
}

/**
 * Verifies a password against a stored hash
 * @param password - The plain text password to verify
 * @param storedHash - The stored hash in format: salt:iterations:hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, iterationsStr, hashHex] = storedHash.split(':');
    const iterations = parseInt(iterationsStr, 10);

    // Convert hex strings back to Uint8Arrays
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const storedHashBytes = new Uint8Array(hashHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Derive the key with the same parameters
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const derivedHashBytes = new Uint8Array(derivedBits);

    // Constant-time comparison
    if (derivedHashBytes.length !== storedHashBytes.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < derivedHashBytes.length; i++) {
      mismatch |= derivedHashBytes[i] ^ storedHashBytes[i];
    }

    return mismatch === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Validates password strength
 * @param password - The password to validate
 * @returns An object with isValid boolean and optional error message
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters' };
  }

  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)'
    };
  }

  return { isValid: true };
}
