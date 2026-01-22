/**
 * Data masking utilities for POPIA compliance
 * Masks sensitive information like phone numbers and WhatsApp IDs
 */

/**
 * Mask a phone number or WhatsApp ID
 * Shows only last 4 digits: +27********1234
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return 'N/A'
  
  // Remove any non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  if (cleaned.length <= 4) {
    return '****'
  }
  
  // Show country code if present, mask middle, show last 4
  if (cleaned.startsWith('+')) {
    const countryCode = cleaned.match(/^\+\d{1,3}/)?.[0] || '+'
    const last4 = cleaned.slice(-4)
    const masked = '*'.repeat(Math.max(0, cleaned.length - countryCode.length - 4))
    return `${countryCode}${masked}${last4}`
  }
  
  // No country code, just mask and show last 4
  const last4 = cleaned.slice(-4)
  const masked = '*'.repeat(Math.max(0, cleaned.length - 4))
  return `${masked}${last4}`
}

/**
 * Mask an email address
 * Shows first letter and domain: j****@example.com
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'N/A'
  
  const [localPart, domain] = email.split('@')
  if (!domain) return email
  
  if (localPart.length <= 1) {
    return `*@${domain}`
  }
  
  const firstChar = localPart[0]
  const masked = '*'.repeat(localPart.length - 1)
  return `${firstChar}${masked}@${domain}`
}

/**
 * Mask a name (show first name only, mask last name)
 */
export function maskName(name: string | null | undefined): string {
  if (!name) return 'Unknown'
  
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0]
  }
  
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  const maskedLastName = lastName.length > 0 ? `${lastName[0]}***` : ''
  
  if (parts.length === 2) {
    return `${firstName} ${maskedLastName}`
  }
  
  // Multiple middle names - show first, mask rest
  return `${firstName} ${maskedLastName}`
}
