// Email validation utilities
// This module provides email validation functions to ensure emails contain '@' symbol

/**
 * Validates if an email address contains the required '@' symbol
 * @param email - The email address to validate
 * @returns true if email contains '@', false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Check if email contains '@' symbol
  return email.includes('@') && email.indexOf('@') > 0 && email.indexOf('@') < email.length - 1;
}

/**
 * Validates email format more thoroughly (basic format check)
 * @param email - The email address to validate
 * @returns true if email has basic valid format, false otherwise
 */
export function isValidEmailFormat(email: string): boolean {
  if (!isValidEmail(email)) {
    return false;
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates and sanitizes email input
 * @param email - The email address to validate and sanitize
 * @returns object with isValid boolean and sanitized email string
 */
export function validateAndSanitizeEmail(email: string): { isValid: boolean; sanitizedEmail: string; error?: string } {
  if (!email) {
    return {
      isValid: false,
      sanitizedEmail: '',
      error: 'Email is required'
    };
  }
  
  // Trim whitespace
  const sanitizedEmail = email.trim().toLowerCase();
  
  // Check for @ symbol
  if (!sanitizedEmail.includes('@')) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email must contain @ symbol'
    };
  }
  
  // Check basic format
  if (!isValidEmailFormat(sanitizedEmail)) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Email format is invalid'
    };
  }
  
  return {
    isValid: true,
    sanitizedEmail
  };
}

/**
 * Validation error messages for email validation
 */
export const EMAIL_VALIDATION_ERRORS = {
  REQUIRED: 'Email address is required',
  MISSING_AT_SYMBOL: 'Email must contain @ symbol',
  INVALID_FORMAT: 'Email format is invalid',
  TOO_SHORT: 'Email address is too short',
  TOO_LONG: 'Email address is too long (maximum 255 characters)'
} as const;