/**
 * Validates that a plugin or publisher identifier matches the required format.
 *
 * Identifiers must:
 * - Be lowercase.
 * - Contain only letters, numbers, hyphens, and underscores.
 * - Start and end with a letter or number.
 * - Be at least 2 characters long.
 *
 * @param id - The identifier string to validate.
 * @returns The same id if valid.
 * @throws Error if the identifier does not meet the required pattern.
 */
export function validateId(id: string): string {
  const pattern = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$/
  if (!pattern.test(id)) {
    throw new Error(
      `Invalid identifier '${id}'. Must be lowercase, can contain 
        letters, numbers, hyphens, and underscores, must start and 
        end with a letter or number, and be at least 2 characters long.`
    )
  }
  return id
}
