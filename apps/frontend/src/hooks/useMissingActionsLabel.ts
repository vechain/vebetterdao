import { useMemo } from "react"
import { useTranslation } from "react-i18next"

/**
 * Hook to get the missing actions label
 * @param missingActions - The number of missing actions
 * @param isUserDelegatee - Whether the user is a delegatee
 * @returns The missing actions label
 */
export const useMissingActionsLabel = ({
  missingActions,
  isUserDelegatee,
}: {
  missingActions: number
  isUserDelegatee: boolean
}) => {
  const { t } = useTranslation()
  const delegatorQualified = missingActions === 0 && !isUserDelegatee

  const short = useMemo(() => {
    if (delegatorQualified) {
      return t("Qualified to vote")
    }
    if (isUserDelegatee)
      return t(`Your delegator needs {{missingActions}} more action${missingActions > 1 ? "s" : ""}`, {
        missingActions,
      })
    return t(`You need {{missingActions}} more action${missingActions > 1 ? "s" : ""}`, { missingActions })
  }, [t, missingActions, isUserDelegatee])

  const long = useMemo(() => {
    if (delegatorQualified) {
      return t("You are qualified to vote and your voting power is managed by your delegatee.")
    }

    if (isUserDelegatee)
      return t(
        `Your delegator needs at least {{missingActions}} more action${missingActions > 1 ? "s" : ""} to become able to vote on this round.`,
        {
          missingActions,
        },
      )
    return t(
      `You need at least {{missingActions}} more action${missingActions > 1 ? "s" : ""} to become able to vote on this round.`,
      {
        missingActions,
      },
    )
  }, [isUserDelegatee, t, missingActions])

  return { short, long }
}
