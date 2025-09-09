/**
 * Removes the first occurrence of an exact title heading from markdown content.
 * This is useful for preventing duplicate titles when the title is already displayed
 * elsewhere in the UI.
 *
 * @param markdown - The markdown content to process
 * @param title - The exact title text to remove (without the # prefix)
 * @returns The markdown content with the specified title heading removed
 */
export const removeTitleHeading = (markdown?: string, title?: string): string => {
  if (!markdown || !title) return markdown ?? ""

  const lines = markdown.split("\n")
  const titleHeading = `# ${title}`
  const titleIndex = lines.findIndex(line => line.trim() === titleHeading)

  // Return original markdown if title heading not found
  if (titleIndex === -1) return markdown

  // Get content before and after the title
  const beforeTitle = lines.slice(0, titleIndex)
  const afterTitleLines = lines.slice(titleIndex + 1)

  // Find first non-empty line after title (skip empty lines following the title)
  const firstContentIndex = afterTitleLines.findIndex(line => line.trim() !== "")

  // Return empty string if no content exists after removing the title
  if (firstContentIndex === -1) return beforeTitle.join("\n")

  // Combine content before title and content after title (excluding empty lines after title)
  const afterTitle = afterTitleLines.slice(firstContentIndex)
  return [...beforeTitle, ...afterTitle].join("\n")
}

export default {
  removeTitleHeading,
}
