// cloudflare/utils/jwt.ts
// JWT token generation and verification for Cloudflare Workers
// Uses Web Crypto API (native to Workers runtime)

export interface JWTPayload {
  sub: string; // Subject (user ID)
  email?: string;
  username?: string;
  iat: number; // Issued at
  exp: number; // Expiration
  [key: string]: any;
}

/**
 * Encodes data to Base64URL format
 */
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decodes Base64URL format to Uint8Array
 */
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

/**
 * Generates a JWT token
 * @param payload - The payload to include in the token
 * @param secret - The secret key used to sign the token
 * @param expiresIn - Token expiration time in seconds (default: 24 hours)
 * @returns A signed JWT token string
 */
export async function generateJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: number = 86400 // 24 hours
): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)));

  const data = `${headerB64}.${payloadB64}`;
  const dataBuffer = encoder.encode(data);

  // Import the secret key
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${data}.${signatureB64}`;
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @param secret - The secret key used to verify the signature
 * @returns The decoded payload if valid, null if invalid
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    const data = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Import the secret key
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Verify the signature
    const signature = base64UrlDecode(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      dataBuffer
    );

    if (!isValid) {
      return null;
    }

    // Decode and parse the payload
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
    const payload: JWTPayload = JSON.parse(payloadJson);

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Extracts the JWT token from the Authorization header
 * @param authHeader - The Authorization header value
 * @returns The token string or null
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to verify JWT and attach user to context
 */
export async function authMiddleware(
  authHeader: string | null,
  secret: string
): Promise<JWTPayload | null> {
  const token = extractTokenFromHeader(authHeader);
  if (!token) {
    return null;
  }

  return await verifyJWT(token, secret);
}
