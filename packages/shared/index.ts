/**
 * Shared runtime utilities used by both api and web.
 */

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

/**
 * Sanitize a raw username input:
 * - trim whitespace
 * - lowercase
 * - strip non-alphanumeric/underscore characters
 * - cap at 20 characters
 */
export function sanitizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);
}

/**
 * Validate a (pre-sanitized) username.
 * Rules: 3–20 characters, only lowercase a-z, digits, underscores.
 */
export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username);
}

/**
 * Truncate message content to a maximum length.
 * Returns trimmed content, or empty string if input is blank.
 */
export function truncateContent(text: string, max = 2000): string {
  return text.trim().slice(0, max);
}
