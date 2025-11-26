import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Base URL - uses deployed worker in production, env var for local dev
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'https://publicdomainhunter.averymiddlebrook2014.workers.dev'
    : '');

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
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove common formatting artifacts
    .replace(/[\r\n]+/g, ' ')
    .trim();
}
