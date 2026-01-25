/**
 * Input validation and sanitization utilities
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const sanitized = email.trim().toLowerCase()
  
  if (!sanitized) {
    return { isValid: false, error: 'Email is required' }
  }
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'Email is too long' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' }
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long' }
  }
  
  return { isValid: true }
}

/**
 * Validate WhatsApp ID format
 */
export function validateWhatsAppId(id: string): ValidationResult {
  const sanitized = id.trim()
  
  if (!sanitized) {
    return { isValid: false, error: 'WhatsApp ID is required' }
  }
  
  if (!/^\d{10,15}$/.test(sanitized)) {
    return { isValid: false, error: 'Invalid WhatsApp ID format' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Sanitize text input
 */
export function sanitizeText(text: string, maxLength: number = 1000): string {
  return text
    .replace(/[<>\"'&]/g, '') // Remove HTML special characters
    .trim()
    .slice(0, maxLength)
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  const sanitized = url.trim()
  
  if (!sanitized) {
    return { isValid: false, error: 'URL is required' }
  }
  
  try {
    const urlObj = new URL(sanitized)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS' }
    }
    return { isValid: true, sanitized }
  } catch {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): ValidationResult {
  const sanitized = uuid.trim()
  
  if (!sanitized) {
    return { isValid: false, error: 'UUID is required' }
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid UUID format' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate and sanitize name input
 */
export function validateName(name: string): ValidationResult {
  const sanitized = sanitizeText(name, 100)
  
  if (!sanitized) {
    return { isValid: false, error: 'Name is required' }
  }
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' }
  }
  
  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate phone number format (international)
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const sanitized = phone.trim().replace(/\s+/g, '')
  
  if (!sanitized) {
    return { isValid: false, error: 'Phone number is required' }
  }
  
  // Must start with + and country code
  if (!sanitized.startsWith('+')) {
    return { isValid: false, error: 'Phone number must include country code (e.g., +27)' }
  }
  
  // Basic international phone format: +[1-4 digits country code][4-15 digits]
  const phoneRegex = /^\+[1-9]\d{1,3}\d{4,14}$/
  if (!phoneRegex.test(sanitized)) {
    return { isValid: false, error: 'Invalid phone number format' }
  }
  
  if (sanitized.length < 8 || sanitized.length > 17) {
    return { isValid: false, error: 'Phone number length invalid' }
  }
  
  return { isValid: true, sanitized }
}

/**
 * Validate OTP code format
 */
export function validateOtpCode(code: string): ValidationResult {
  const sanitized = code.trim().replace(/\s+/g, '')
  
  if (!sanitized) {
    return { isValid: false, error: 'Verification code is required' }
  }
  
  if (!/^\d{6}$/.test(sanitized)) {
    return { isValid: false, error: 'Verification code must be 6 digits' }
  }
  
  return { isValid: true, sanitized }
}
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Get existing requests for this key
    const keyRequests = this.requests.get(key) || []
    
    // Filter out old requests
    const recentRequests = keyRequests.filter(time => time > windowStart)
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false
    }
    
    // Add current request
    recentRequests.push(now)
    this.requests.set(key, recentRequests)
    
    return true
  }
  
  // Clean up old entries periodically
  cleanup(): void {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 hour
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > now - maxAge)
      if (recentRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, recentRequests)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Clean up rate limiter every 10 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => rateLimiter.cleanup(), 10 * 60 * 1000)
}