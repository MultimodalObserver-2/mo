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
