import { useCanUserVote, useUserScore, useUserDelegation } from "@/api"
import { useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useMissingActionsLabel } from "@/hooks"
import { useRouter } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"

type UserProps = {
  address?: string
  isConnectedUser?: boolean
}

export type StatusMessages = {
  labelStatus: string
  descriptionLabel: string
}

export type VotingStatusProps =
  | "delegator"
  | "secondary"
  | "no-votes"
  | "no-actions"
  | "qualified"
  | "secondary-at-snapshot"
  | null

// export type BannerToShow = "none" | "linkedAccount" | "doAction" | "veDelegated"

export type CantVoteWarningProps = {
  warningTitle: string
  warningDescription: string
  onLearnMoreClick?: () => void
  // showBanner: BannerToShow
}

export type VotingQualification = {
  warningVotingQualification: CantVoteWarningProps
  status: string
  scorePercentage: number
  isLoading: boolean
}

/**
 * Centralized hook to be displayed in the voting qualification and the warnings accross the app
 */
export const useVotingStatusMessages = ({ address, isConnectedUser }: UserProps) => {
  const { t } = useTranslation()
  const router = useRouter()

  // User's States
  const { account } = useWallet()
  const {
    isPersonAtSnapshot,
    isEntity,
    isEntityAtSnapshot,
    hasVotesAtSnapshot,
    isLoading: canVoteLoading,
  } = useCanUserVote(address ?? account ?? undefined)
  const { missingActions, isUserDelegatee, scorePercentage, isLoading: isScoreLoading } = useUserScore(address)
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()
  const missingActionsLabel = useMissingActionsLabel({
    missingActions,
    isUserDelegatee,
  })

  // Loading States
  const isLoading = isScoreLoading || isLoadingDelegator || canVoteLoading

  // Redirection link to learn more about the voting status in the warning
  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  const votingStatus = useMemo<VotingStatusProps | null>(() => {
    if (!account || isLoading) return null
    if (isPersonAtSnapshot) return "qualified"
    if (isDelegator) return "delegator"
    if (isEntity && !isEntityAtSnapshot) return "secondary"
    if (!hasVotesAtSnapshot) return "no-votes"
    if (!isPersonAtSnapshot && !isEntityAtSnapshot && !isEntity) return "no-actions"
    if (isEntityAtSnapshot) return "secondary-at-snapshot"

    return null
  }, [account, isEntity, isDelegator, hasVotesAtSnapshot, isPersonAtSnapshot, isLoading])

  const cantVoteReasonText = useMemo<CantVoteWarningProps | null>(() => {
    switch (votingStatus) {
      case "delegator":
        return {
          warningTitle: t("You can’t vote because this is a delegated account."),
          warningDescription: t("Go to your profile to learn more about delegated accounts."),
          onLearnMoreClick: handleGoToGovernance,
        }
      case "secondary":
      case "secondary-at-snapshot":
        return {
          warningTitle: t("You can’t vote because this is a secondary account."),
          warningDescription: t(
            "Switch to your main account to vote or go to your profile to learn more about linked accounts.",
          ),
          onLearnMoreClick: handleGoToLinking,
        }
      case "no-votes":
        return {
          warningTitle: t("You can’t vote because you have no voting power."),
          warningDescription: t(
            "Snapshot is taken every sunday at 23:59 UTC. You can earn actions by using the dApps.",
          ),
        }
      case "no-actions":
        return {
          warningTitle: t("You can't vote because you haven't accumulated enough actions."),
          warningDescription: t("You can earn actions by using the dApps."),
        }
      default:
        return null
    }
  }, [votingStatus, handleGoToGovernance, handleGoToLinking])

  const qualificationMessages = useMemo<StatusMessages | null>(() => {
    switch (votingStatus) {
      case "qualified":
        return {
          labelStatus: t("Qualified to vote"),
          descriptionLabel: isConnectedUser
            ? t(
                "Your are now qualified to vote. To maintain your qualification, keep using the Apps and earning B3TR tokens",
              )
            : t(
                "The user is now qualified to vote. To maintain the qualification, the user must keep using the Apps and earning B3TR tokens",
              ),
        }
      case "secondary-at-snapshot":
      case "secondary":
        return {
          labelStatus: t("Voting power transferred to passport"),
          descriptionLabel: isConnectedUser
            ? t("To be availabe to vote on the platform, you must be the primary account at snapshot")
            : t("To be availabe to vote on the platform, the user must be the primary account at snapshot"),
        }
      case "no-actions":
      case "delegator":
        return {
          labelStatus: missingActionsLabel.short,
          descriptionLabel: missingActionsLabel.long,
        }
    }

    return null
  }, [isPersonAtSnapshot, isConnectedUser, missingActionsLabel, isEntityAtSnapshot, isEntity, t])

  return {
    cantVoteReasonText,
    qualificationMessages,
    scorePercentage,
    isPersonAtSnapshot,
    isLoading,
  }
}
