import { useAllocationsRound, useAllocationsRoundState } from "@/api"
import { HStack, Icon, Skeleton, Text, TextProps } from "@chakra-ui/react"
import { ReactNode, useMemo } from "react"
import { DotSymbol } from "../DotSymbol"
import { FaThumbsUp } from "react-icons/fa6"
import { useTranslation } from "react-i18next"

type Props = {
  roundId: string
  renderIcon?: boolean
  renderBadge?: boolean
  textProps?: TextProps
}
export const AllocationStateBadge = ({ roundId, renderIcon = true, renderBadge = true, textProps = {} }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAllocationsRoundState(roundId)
  const { data: allocationRound } = useAllocationsRound(roundId)
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  if (isLoading)
    return (
      <Skeleton>
        <Badge text={t("loading")} icon={renderIcon ? <DotSymbol size={4} color="error.primary" /> : undefined} />
      </Skeleton>
    )
  if (error || data === undefined)
    return (
      <Badge
        textProps={{
          color: "status.negative.primary",
          ...textProps,
        }}
        text={t("Error getting state")}
        icon={renderIcon ? <DotSymbol size={4} color="status.negative.primary" /> : undefined}
      />
    )

  if (isActive)
    return (
      <Badge
        textProps={{
          color: "status.positive.strong",
          ...textProps,
        }}
        text={t("Active now")}
        icon={renderIcon ? <DotSymbol pulse size={2} color={"status.positive.strong"} /> : undefined}
      />
    )
  if (!isActive)
    return (
      <Badge
        textProps={{
          color: "status.positive.primary",
          ...textProps,
        }}
        text={t("Concluded")}
        icon={renderIcon ? <Icon as={FaThumbsUp} boxSize={4} color="status.positive.primary" /> : undefined}
      />
    )
}

type BadgeProps = {
  icon?: ReactNode
  text: string
  textProps?: TextProps
}

export const Badge = ({ icon, text, textProps }: BadgeProps) => {
  return (
    <HStack gap="1" align="center" rounded="full" p="0">
      {icon}
      <Text textStyle="xs" fontWeight="semibold" {...textProps} data-testid={`round-status`}>
        {text}
      </Text>
    </HStack>
  )
}
