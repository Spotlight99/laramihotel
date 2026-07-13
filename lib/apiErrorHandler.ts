/**
 * API Error Handler
 * Parses backend validation errors and normalizes them for frontend display.
 */

export interface ValidationError {
  fieldErrors: Record<string, string[]>;
  nonFieldErrors: string[];
}

/**
 * Parse Django REST Framework error responses
 * Handles formats like:
 * {
 *   "check_in": ["This field may not be null."],
 *   "non_field_errors": ["This room is already booked..."]
 * }
 */
export function parseValidationError(error: any): ValidationError {
  const result: ValidationError = {
    fieldErrors: {},
    nonFieldErrors: [],
  };

  if (!error) return result;

  // Handle error.response.data (from Fetch API with manual parsing)
  const errorData = error.response?.data || error.data || error;

  if (typeof errorData !== 'object') {
    // If it's a string error, treat as non-field error
    if (typeof errorData === 'string') {
      result.nonFieldErrors.push(errorData);
    }
    return result;
  }

  // Parse field errors and non-field errors
  Object.entries(errorData).forEach(([key, value]) => {
    if (key === 'non_field_errors' || key === 'nonFieldErrors') {
      // Handle non-field errors
      if (Array.isArray(value)) {
        result.nonFieldErrors = value.map((msg: any) =>
          typeof msg === 'string' ? msg : msg?.detail || String(msg)
        );
      } else if (typeof value === 'string') {
        result.nonFieldErrors.push(value);
      }
    } else if (key === 'detail') {
      // Handle detail field (sometimes used for non-field errors)
      if (typeof value === 'string') {
        result.nonFieldErrors.push(value);
      } else if (Array.isArray(value)) {
        result.nonFieldErrors.push(...value.map((v: any) => String(v)));
      }
    } else {
      // Handle field-specific errors
      if (Array.isArray(value)) {
        result.fieldErrors[key] = value.map((msg: any) =>
          typeof msg === 'string' ? msg : msg?.detail || String(msg)
        );
      } else if (typeof value === 'string') {
        result.fieldErrors[key] = [value];
      } else if (value && typeof value === 'object' && 'detail' in value) {
        result.fieldErrors[key] = [String((value as any).detail)];
      }
    }
  });

  return result;
}

/**
 * Extract the first error message for a specific field
 */
export function getFieldErrorMessage(fieldErrors: Record<string, string[]>, fieldName: string): string | null {
  const errors = fieldErrors[fieldName];
  if (Array.isArray(errors) && errors.length > 0) {
    return errors[0];
  }
  return null;
}

/**
 * Check if a field has validation errors
 */
export function hasFieldError(fieldErrors: Record<string, string[]>, fieldName: string): boolean {
  return Array.isArray(fieldErrors[fieldName]) && fieldErrors[fieldName].length > 0;
}
