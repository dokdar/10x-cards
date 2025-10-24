/**
 * Validation utility functions
 */

/**
 * UUID v4 validation regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID v4
 * @param value - The string to validate
 * @returns true if the string is a valid UUID, false otherwise
 */
export function isUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}
