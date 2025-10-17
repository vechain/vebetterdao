import dayjs from "dayjs"

export const TITLE_PLACEHOLDER = "[TITLE_PLACEHOLDER]"
export const SUMMARY_PLACEHOLDER = "[SUMMARY_PLACEHOLDER]"
export const ONCHAIN_ACTION_PLACEHOLDER = "[ONCHAIN_ACTION_PLACEHOLDER]"
export const TEXT_ONLY_PLACEHOLDER = "[TEXT-ONLY_PLACEHOLDER]"
export const ADDRESS_PLACEHOLDER = "[ADDRESS_PLACEHOLDER]"
export const DATE_PLACEHOLDER = "[DATE_PLACEHOLDER]"
export const MOTIVATION_PLACEHOLDER =
  "[Explain the problem or opportunity that this proposal addresses. Why is this proposal important for VebetterDAO? What are the potential benefits?]"
export const DETAILED_SPECIFICATION_PLACEHOLDER =
  "[Provide a detailed description of the proposal. Include technical details, methodologies, and any other relevant information. Break this section into sub-sections if necessary.]"
export const GOALS_PLACEHOLDER = "[List the specific goals and outcomes you aim to achieve with this proposal.]"
export const RISKS_PLACEHOLDER =
  "[Identify and assess potential risks associated with this proposal. Include mitigation strategies for each identified risk.]"
export const SUCCESS_METRICS_PLACEHOLDER =
  "[Define the metrics that will be used to measure the success of the proposal. How will you track progress and determine if the goals are met?]"
export const COMMUNITY_ENGAGEMENT_PLACEHOLDER =
  "[Describe how you plan to involve the VebetterDAO community in the proposal. How will you gather feedback and ensure that community members are informed and supportive?]"
export const CONCLUSION_PLACEHOLDER =
  "[Summarize the key points of the proposal and restate the desired outcome. Encourage community members to participate in the discussion and voting process.]"
export const REFERENCES_PLACEHOLDER = "[List any sources, documents, or links that are referenced in the proposal.]"
export const NAME_PLACEHOLDER = "[Your Name]"
export const CONTACT_INFORMATION_PLACEHOLDER = "[Your Contact Information]"
export const REMOVED_PLACEHOLDER = "[Removed]"
export const MODIFIED_PLACEHOLDER = "[Modified]"
export const ADDED_FEATURES_PLACEHOLDER = "[Added]"
/**
 * Governance markdown Proposal Template for VebetterDAO
 */
export const GovernanceProposalTemplate = `
# ${TITLE_PLACEHOLDER}
## Proposal Summary
${SUMMARY_PLACEHOLDER}
## Proposal Type
Specify the type of proposal:
- [${ONCHAIN_ACTION_PLACEHOLDER}] On-chain Action
- [${TEXT_ONLY_PLACEHOLDER}] Text-only Proposal
## Proposal Changes
- Removed : ${REMOVED_PLACEHOLDER}
- Modified: ${MODIFIED_PLACEHOLDER}
- Added: ${ADDED_FEATURES_PLACEHOLDER}
## Motivation
${MOTIVATION_PLACEHOLDER}
## Detailed Specification
${DETAILED_SPECIFICATION_PLACEHOLDER}

### Goals
- ${GOALS_PLACEHOLDER}

## Risk Analysis
${RISKS_PLACEHOLDER}

## Success Metrics
${SUCCESS_METRICS_PLACEHOLDER}

## Community Engagement
${COMMUNITY_ENGAGEMENT_PLACEHOLDER}

## Conclusion
${CONCLUSION_PLACEHOLDER}

## References
${REFERENCES_PLACEHOLDER}

---

### Author Information
- Name: ${NAME_PLACEHOLDER}
- Contact Information: ${CONTACT_INFORMATION_PLACEHOLDER}
- Vechain address: ${ADDRESS_PLACEHOLDER}

**Date:**  
${DATE_PLACEHOLDER}
`

/**
 *  Updates the placeholders in the markdown template with the provided data
 * @param markdownTemplate  The markdown template to update - defaults to GovernanceProposalTemplate
 * @param actionsLength  The length of the actions array
 * @param account  The account address
 * @param title  The title of the proposal
 * @param shortDescription  The short description of the proposal
 * @returns  The updated markdown template
 */

type UpdateMarkdownTemplatePlaceholdersParams = {
  markdownTemplate?: string
  actionsLength?: number
  account?: string | null
  title?: string
  shortDescription?: string
}
export const updateMarkdownTemplatePlaceholders = ({
  markdownTemplate,
  actionsLength = 0,
  account,
  title,
  shortDescription,
}: UpdateMarkdownTemplatePlaceholdersParams) => {
  let updatedMarkdown = markdownTemplate ?? GovernanceProposalTemplate

  updatedMarkdown = updatedMarkdown.replace(ONCHAIN_ACTION_PLACEHOLDER, actionsLength ? "X" : " ")
  updatedMarkdown = updatedMarkdown.replace(TEXT_ONLY_PLACEHOLDER, actionsLength ? " " : "X")
  if (account) {
    updatedMarkdown = updatedMarkdown.replace(ADDRESS_PLACEHOLDER, account)
  }
  if (title) updatedMarkdown = updatedMarkdown.replace(TITLE_PLACEHOLDER, title)
  if (shortDescription) updatedMarkdown = updatedMarkdown.replace(SUMMARY_PLACEHOLDER, shortDescription)

  updatedMarkdown = updatedMarkdown.replace(DATE_PLACEHOLDER, dayjs().format("MMMM D, YYYY"))

  return updatedMarkdown
}

/**
 *  Validates a proposal template to ensure that all required placeholders are not present
 * @param template  The proposal template to validate
 * @returns An array of strings representing the missing placeholders in the template
 */
export const validateProposalTemplate = (template: string): string[] => {
  // Check if the template contains any placeholder and return an associated message if it does
  const errors: string[] = []
  if (template.includes(TITLE_PLACEHOLDER)) {
    errors.push("Title")
  }
  if (template.includes(SUMMARY_PLACEHOLDER)) {
    errors.push("Summary")
  }
  if (template.includes(ONCHAIN_ACTION_PLACEHOLDER) || template.includes(TEXT_ONLY_PLACEHOLDER)) {
    errors.push("Proposal type")
  }
  if (template.includes(MOTIVATION_PLACEHOLDER)) {
    errors.push("Motivation")
  }
  if (template.includes(DETAILED_SPECIFICATION_PLACEHOLDER)) {
    errors.push("Detailed Specification")
  }
  if (template.includes(GOALS_PLACEHOLDER)) {
    errors.push("Goals")
  }
  if (template.includes(RISKS_PLACEHOLDER)) {
    errors.push("Risk Analysis")
  }
  if (template.includes(SUCCESS_METRICS_PLACEHOLDER)) {
    errors.push("Success Metrics")
  }
  if (template.includes(COMMUNITY_ENGAGEMENT_PLACEHOLDER)) {
    errors.push("Community Engagement")
  }
  if (template.includes(CONCLUSION_PLACEHOLDER)) {
    errors.push("Conclusion")
  }
  if (template.includes(REFERENCES_PLACEHOLDER)) {
    errors.push("References")
  }
  if (template.includes(NAME_PLACEHOLDER)) {
    errors.push("Author Information")
  }
  if (template.includes(CONTACT_INFORMATION_PLACEHOLDER)) {
    errors.push("Author Information")
  }

  if (template.includes(ADDRESS_PLACEHOLDER)) {
    errors.push("Address")
  }
  if (template.includes(DATE_PLACEHOLDER)) {
    errors.push("Date ")
  }

  if (template.includes(REMOVED_PLACEHOLDER)) {
    errors.push("Proposal Changes - Removed")
  }
  if (template.includes(MODIFIED_PLACEHOLDER)) {
    errors.push("Proposal Changes - Modified")
  }
  if (template.includes(ADDED_FEATURES_PLACEHOLDER)) {
    errors.push("Proposal Changes - Added")
  }
  return errors
}

/**
 *  Removes all placeholders from a proposal template
 */
export const removePlaceholders = (template: string): string => {
  return template
    .replace(TITLE_PLACEHOLDER, "")
    .replace(SUMMARY_PLACEHOLDER, "")
    .replace(ONCHAIN_ACTION_PLACEHOLDER, "")
    .replace(TEXT_ONLY_PLACEHOLDER, "")
    .replace(MOTIVATION_PLACEHOLDER, "")
    .replace(DETAILED_SPECIFICATION_PLACEHOLDER, "")
    .replace(GOALS_PLACEHOLDER, "")
    .replace(RISKS_PLACEHOLDER, "")
    .replace(SUCCESS_METRICS_PLACEHOLDER, "")
    .replace(COMMUNITY_ENGAGEMENT_PLACEHOLDER, "")
    .replace(CONCLUSION_PLACEHOLDER, "")
    .replace(REFERENCES_PLACEHOLDER, "")
    .replace(NAME_PLACEHOLDER, "")
    .replace(CONTACT_INFORMATION_PLACEHOLDER, "")
    .replace(ADDRESS_PLACEHOLDER, "")
    .replace(DATE_PLACEHOLDER, "")
    .replace(REMOVED_PLACEHOLDER, "")
    .replace(MODIFIED_PLACEHOLDER, "")
    .replace(ADDED_FEATURES_PLACEHOLDER, "")
}
