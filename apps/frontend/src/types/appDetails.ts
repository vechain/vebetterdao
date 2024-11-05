export enum XAppsCreationSteps {
  SUBMISSION,
  ENDORSEMENT,
  ALLOCATION,
}
export enum XAppsCreationStepStatus {
  COMPLETED = "COMPLETED",
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
}

export enum EndorsementStatus {
  UNKNOWN = "UNKNOWN",
  LOST = "LOST",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
}

export enum XAppStatus {
  BLACKLISTED = "BLACKLISTED",
  LOOKING_FOR_ENDORSEMENT = "LOOKING_FOR_ENDORSEMENT", // New app, needs endorsement score above threshold
  ENDORSED_NOT_ELIGIBLE = "ENDORSED_NOT_ELIGIBLE", // Endorsement score above threshold, eligible starting from next round
  ENDORSED_AND_ELIGIBLE = "ENDORSED_AND_ELIGIBLE",
  UNENDORSED_AND_ELIGIBLE = "UNENDORSED_AND_ELIGIBLE", // Endorsement score below threshold, still eligible for the next 2 rounds (grace period)
  UNENDORSED_NOT_ELIGIBLE = "UNENDORSED_NOT_ELIGIBLE", // Endorsement score below threshold, not eligible (endorsement lost)
  UNKNOWN = "UNKNOWN",
}
