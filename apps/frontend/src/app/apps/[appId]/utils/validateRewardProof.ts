/**
 * Utility to validate reward proof format according to VeBetterDAO documentation
 * https://docs.vebetterdao.org/developer-guides/sustainability-proof-and-impacts
 */

export type ProofValidationResult = {
  isValid: boolean
  issues: ProofIssue[]
}

export type ProofIssue = {
  type:
    | "empty"
    | "invalid_json"
    | "missing_version"
    | "invalid_structure"
    | "invalid_proof_type"
    | "invalid_impact_code"
  message: string
  severity: "error" | "warning"
}

// Valid proof types according to documentation
const VALID_PROOF_TYPES = ["image", "link", "text", "video"]

// Deprecated impact codes (version 1)
const DEPRECATED_IMPACT_CODES = ["waste_items", "people", "biodiversity"]

/**
 * Validates a reward proof string
 * @param proof The proof string to validate
 * @param allowedImpactKeys Array of allowed impact keys from the contract (optional, for validation)
 * @returns ProofValidationResult with isValid flag and list of issues
 */
export const validateRewardProof = (proof: string, allowedImpactKeys?: string[]): ProofValidationResult => {
  const issues: ProofIssue[] = []

  // Check 1: Empty proof
  if (!proof || proof.trim() === "") {
    issues.push({
      type: "empty",
      message: "Proof is empty. The app is not emitting proofs when distributing rewards.",
      severity: "error",
    })
    return { isValid: false, issues }
  }

  // Check 2: Valid JSON
  let parsedProof: any
  try {
    parsedProof = JSON.parse(proof)
  } catch (error) {
    issues.push({
      type: "invalid_json",
      message: "Proof is not valid JSON format.",
      severity: "error",
    })
    return { isValid: false, issues }
  }

  // Check 3: Version field
  if (!parsedProof.version) {
    issues.push({
      type: "missing_version",
      message: "Proof is missing 'version' field. This is deprecated format (version 1).",
      severity: "warning",
    })
  }

  // Check 4: If version 2, validate structure
  if (parsedProof.version === 2) {
    // Must have at least proof or impact
    const hasProof = parsedProof.proof && typeof parsedProof.proof === "object"
    const hasImpact = parsedProof.impact && typeof parsedProof.impact === "object"

    if (!hasProof && !hasImpact) {
      issues.push({
        type: "invalid_structure",
        message: "Version 2 proof must contain at least 'proof' or 'impact' field.",
        severity: "error",
      })
    }

    // Validate proof types
    if (hasProof) {
      const proofKeys = Object.keys(parsedProof.proof)
      const invalidProofTypes = proofKeys.filter(key => !VALID_PROOF_TYPES.includes(key))

      if (invalidProofTypes.length > 0) {
        issues.push({
          type: "invalid_proof_type",
          message: `Invalid proof type(s): ${invalidProofTypes.join(", ")}. Valid types are: ${VALID_PROOF_TYPES.join(", ")}.`,
          severity: "error",
        })
      }
    }

    // Validate impact codes
    if (hasImpact) {
      const impactKeys = Object.keys(parsedProof.impact)

      // Only validate against allowed keys if they are provided
      if (allowedImpactKeys && allowedImpactKeys.length > 0) {
        const invalidImpactCodes = impactKeys.filter(
          key => !allowedImpactKeys.includes(key) && !DEPRECATED_IMPACT_CODES.includes(key),
        )

        if (invalidImpactCodes.length > 0) {
          issues.push({
            type: "invalid_impact_code",
            message: `Invalid impact code(s): ${invalidImpactCodes.join(", ")}. Valid codes are: ${allowedImpactKeys.join(", ")}.`,
            severity: "error",
          })
        }
      }

      // Check for deprecated impact codes
      const deprecatedCodesUsed = impactKeys.filter(key => DEPRECATED_IMPACT_CODES.includes(key))
      if (deprecatedCodesUsed.length > 0) {
        issues.push({
          type: "invalid_impact_code",
          message: `Deprecated impact code(s): ${deprecatedCodesUsed.join(", ")}. These codes are from version 1 and should not be used.`,
          severity: "warning",
        })
      }

      // Validate that impact values are numbers
      for (const [key, value] of Object.entries(parsedProof.impact)) {
        if (typeof value !== "number" && typeof value !== "string") {
          issues.push({
            type: "invalid_structure",
            message: `Impact value for '${key}' must be a number or numeric string.`,
            severity: "error",
          })
        }
      }
    }
  } else if (parsedProof.version === 1 || !parsedProof.version) {
    // Version 1 validation (deprecated format)
    issues.push({
      type: "invalid_structure",
      message: "Using deprecated version 1 format. Please migrate to version 2 format as documented.",
      severity: "warning",
    })
  }

  const hasErrors = issues.some(issue => issue.severity === "error")
  return { isValid: !hasErrors, issues }
}

/**
 * Gets a summary message for the validation result
 */
export const getProofValidationSummary = (result: ProofValidationResult): string => {
  const errorCount = result.issues.filter(i => i.severity === "error").length
  const warningCount = result.issues.filter(i => i.severity === "warning").length

  if (errorCount > 0) {
    return `Found ${errorCount} error${errorCount > 1 ? "s" : ""} in reward proof format`
  }
  if (warningCount > 0) {
    return `Found ${warningCount} warning${warningCount > 1 ? "s" : ""} in reward proof format`
  }
  return "Reward proofs are valid"
}
