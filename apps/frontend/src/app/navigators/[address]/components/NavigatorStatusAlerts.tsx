import { Alert } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { LuDoorOpen, LuGauge, LuCircleAlert, LuUserCheck } from "react-icons/lu"

import { type NavigatorStatusValue } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
type DelegationInfo = { delegatedAt: number } | undefined

const formatter = getCompactFormatter(2)

type Props = {
  status: NavigatorStatusValue
  isOwnPage: boolean
  isDelegatedHere: boolean
  isAtCapacity: boolean
  isBelowMinStake: boolean
  minStakeScaled: string
  currentDelegatedNum: number
  displayName: string
  delegationInfo: DelegationInfo
}

export const NavigatorStatusAlerts = ({
  status,
  isOwnPage,
  isDelegatedHere,
  isAtCapacity,
  isBelowMinStake,
  minStakeScaled,
  currentDelegatedNum,
  displayName,
  delegationInfo,
}: Props) => {
  const { t } = useTranslation()

  return (
    <>
      {status === "EXITING" && (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator>
            <LuDoorOpen />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {isOwnPage
              ? t("You have announced your exit. Continue voting during the notice period.")
              : t("This navigator is exiting. Delegations will become void after the notice period.")}
          </Alert.Title>
        </Alert.Root>
      )}

      {status === "DEACTIVATED" && (
        <Alert.Root status="error" borderRadius="xl">
          <Alert.Indicator>
            <LuDoorOpen />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {isOwnPage
              ? t("You have been deactivated. You can still withdraw your remaining stake.")
              : t("This navigator has been deactivated.")}
          </Alert.Title>
        </Alert.Root>
      )}

      {isAtCapacity && status === "ACTIVE" && !isOwnPage && !isDelegatedHere && (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator>
            <LuGauge />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {t("This navigator has reached its delegation capacity and cannot receive new delegations.")}
          </Alert.Title>
        </Alert.Root>
      )}

      {isBelowMinStake && status === "ACTIVE" && (
        <Alert.Root status="warning" borderRadius="xl">
          <Alert.Indicator>
            <LuCircleAlert />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {isOwnPage
              ? t(
                  "Your stake is below the minimum required amount of {{amount}} B3TR. You cannot receive new delegations until you increase your stake.",
                  { amount: formatter.format(Number(minStakeScaled)) },
                )
              : t("This navigator cannot receive new delegations until he/she stakes above {{amount}} B3TR.", {
                  amount: formatter.format(Number(minStakeScaled)),
                })}
          </Alert.Title>
        </Alert.Root>
      )}

      {isDelegatedHere && (
        <Alert.Root status="info" borderRadius="xl">
          <Alert.Indicator>
            <LuUserCheck />
          </Alert.Indicator>
          <Alert.Title textStyle="sm">
            {t("You are delegating {{amount}} VOT3 to {{name}}", {
              amount: formatter.format(currentDelegatedNum),
              name: displayName,
            })}
            {delegationInfo?.delegatedAt &&
              ` ${t("since {{date}}", {
                date: new Date(delegationInfo.delegatedAt * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }),
              })}`}
          </Alert.Title>
        </Alert.Root>
      )}
    </>
  )
}
