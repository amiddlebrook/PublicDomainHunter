import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Requests use the same origin as the Cloudflare Worker by default.
// Override only when running the frontend on a separate local port.
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Sanitize text by removing HTML entities, extra whitespace, and formatting issues
 */
export function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';

  return text
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common formatting artifacts
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
