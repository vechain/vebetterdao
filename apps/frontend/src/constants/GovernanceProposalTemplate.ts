export const TITLE_PLACEHOLDER = "[TITLE_PLACEHOLDER]"
export const SUMMARY_PLACEHOLDER = "[SUMMARY_PLACEHOLDER]"
export const ONCHAIN_ACTION_PLACEHOLDER = "[ONCHAIN_ACTION_PLACEHOLDER]"
export const TEXT_ONLY_PLACEHOLDER = "[TEXT-ONLY_PLACEHOLDER]"
export const ADDRESS_PLACEHOLDER = "[ADDRESS_PLACEHOLDER]"
export const DATE_PLACEHOLDER = "[DATE_PLACEHOLDER]"

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

## Motivation
[Explain the problem or opportunity that this proposal addresses. Why is this proposal important for VebetterDAO? What are the potential benefits?]

## Detailed Specification
[Provide a detailed description of the proposal. Include technical details, methodologies, and any other relevant information. Break this section into sub-sections if necessary.]

### Goals
- [List the specific goals and outcomes you aim to achieve with this proposal.]

## Risk Analysis
[Identify and assess potential risks associated with this proposal. Include mitigation strategies for each identified risk.]

## Success Metrics
[Define the metrics that will be used to measure the success of the proposal. How will you track progress and determine if the goals are met?]

## Community Engagement
[Describe how you plan to involve the VebetterDAO community in the proposal. How will you gather feedback and ensure that community members are informed and supportive?]

## Conclusion
[Summarize the key points of the proposal and restate the desired outcome. Encourage community members to participate in the discussion and voting process.]

## References
[List any sources, documents, or links that are referenced in the proposal.]

---

### Author Information
- Name: [Your Name]  
- Contact Information: [Your Contact Information]  
- Vechain address: ${ADDRESS_PLACEHOLDER}

**Date:**  
${DATE_PLACEHOLDER}

`
