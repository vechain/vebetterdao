export const getCustomChallengeDescription = (challenge: { description?: string }): string | null => {
  const description = challenge.description?.trim()
  return description || null
}

export const getPublicChallengeDescription = (description: string, isPublic: boolean): string =>
  isPublic ? description.trim() : ""
