/**
 * Converts an Express-like path string (e.g., 'user::id') into a RegExp.
 * This is a simplified implementation that turns 'action::id' into /^action:(.+)$/.
 * For more complex cases, a full RegExp object should be used.
 * @param path The path string.
 * @returns A regular expression with capture groups.
 */
export function pathStringToRegex(path: string): RegExp {
  // This regex finds placeholders like ':id' and replaces them with a capture group.
  // The 'g' flag ensures all placeholders are replaced.
  const pattern = path.replace(/:(\w+)/g, '([^:]+)');
  return new RegExp(`^${pattern}$`);
}