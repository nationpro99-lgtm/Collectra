/**
 * Phone Number Normalization and Validation Utility for WhatsApp Cloud API.
 * Ensures recipient numbers are normalized into the exact international format
 * required by Meta Graph API (E.164 digits without the '+' prefix).
 */

export interface PhoneValidationResult {
  isValid: boolean;
  normalized: string; // E.164 digits without '+' (e.g. "919876543210")
  formatted: string;  // Human-readable format (e.g. "+91 98765 43210")
  countryCode: string;
  error?: string;
}

/**
 * Normalizes any phone number input into Meta WhatsApp Cloud API format.
 * Specifically handles Indian mobile numbers (+91), removing local prefixes,
 * trailing spaces, dashes, parentheses, and duplicate country codes.
 */
export function normalizeWhatsAppNumber(rawPhone: string, defaultCountryCode = '91'): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      countryCode: '',
      error: 'Phone number is required.',
    };
  }

  // Strip all whitespace, parentheses, dashes, dots, and plus signs
  let cleaned = rawPhone.trim().replace(/[\s\(\)\-\.\+]/g, '');

  if (!cleaned) {
    return {
      isValid: false,
      normalized: '',
      formatted: '',
      countryCode: '',
      error: 'Phone number cannot be empty.',
    };
  }

  // If number starts with 0 (e.g. local Indian trunk dial 09876543210), strip the leading 0
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Check for Indian mobile numbers
  // Indian mobile numbers have 10 digits starting with 6, 7, 8, or 9
  const indian10DigitRegex = /^[6-9]\d{9}$/;
  const indianWithCountryRegex = /^91[6-9]\d{9}$/;
  const indianDoubleCountryRegex = /^9191[6-9]\d{9}$/;

  let normalized = cleaned;
  let countryCode = defaultCountryCode;

  // Handle duplicate +91+91 accidental prefix
  if (indianDoubleCountryRegex.test(cleaned)) {
    normalized = cleaned.substring(2);
    countryCode = '91';
  } else if (indianWithCountryRegex.test(cleaned)) {
    normalized = cleaned;
    countryCode = '91';
  } else if (indian10DigitRegex.test(cleaned)) {
    normalized = `91${cleaned}`;
    countryCode = '91';
  } else {
    // General international numbers (E.164: 10 to 15 digits)
    if (!/^\d{10,15}$/.test(cleaned)) {
      return {
        isValid: false,
        normalized: cleaned,
        formatted: rawPhone,
        countryCode: '',
        error: 'Invalid phone number format. Please provide a valid 10-digit mobile number with country code.',
      };
    }
    normalized = cleaned;
  }

  // Final length & digit verification
  if (!/^\d{10,15}$/.test(normalized)) {
    return {
      isValid: false,
      normalized,
      formatted: rawPhone,
      countryCode,
      error: 'Normalized phone number must contain 10 to 15 digits.',
    };
  }

  // Build human-friendly formatted string
  let formatted = `+${normalized}`;
  if (normalized.startsWith('91') && normalized.length === 12) {
    formatted = `+91 ${normalized.substring(2, 7)} ${normalized.substring(7)}`;
  } else if (normalized.startsWith('1') && normalized.length === 11) {
    formatted = `+1 (${normalized.substring(1, 4)}) ${normalized.substring(4, 7)}-${normalized.substring(7)}`;
  }

  return {
    isValid: true,
    normalized,
    formatted,
    countryCode,
  };
}
