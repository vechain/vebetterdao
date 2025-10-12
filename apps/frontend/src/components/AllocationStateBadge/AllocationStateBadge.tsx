import { useAllocationsRound, useAllocationsRoundState } from "@/api"
import { BadgeProps, Badge as ChakraBadge, Icon, Skeleton } from "@chakra-ui/react"
import { ReactNode, useMemo } from "react"
import { DotSymbol } from "../DotSymbol"
import { FaThumbsUp } from "react-icons/fa6"
import { useTranslation } from "react-i18next"

type Props = {
  roundId: string
  renderIcon?: boolean
}
export const AllocationStateBadge = ({ roundId, renderIcon = true }: Props) => {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAllocationsRoundState(roundId)
  const { data: allocationRound } = useAllocationsRound(roundId)
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  if (isLoading)
    return (
      <Skeleton>
        <Badge variant="neutral" text={t("loading")} icon={renderIcon ? <DotSymbol size={4} /> : undefined} />
      </Skeleton>
    )
  if (error || data === undefined)
    return (
      <Badge
        variant="negative"
        text={t("Error getting state")}
        icon={renderIcon ? <DotSymbol size={4} /> : undefined}
      />
    )

  if (isActive)
    return (
      <Badge
        variant="info"
        text={t("Active now")}
        icon={renderIcon ? <DotSymbol pulse size={2} color="status.info.strong" /> : undefined}
      />
    )
  if (!isActive)
    return (
      <Badge
        variant="neutral"
        text={t("Concluded")}
        icon={renderIcon ? <Icon as={FaThumbsUp} boxSize={4} /> : undefined}
      />
    )
}

export const Badge = ({ icon, variant, text }: { icon?: ReactNode; text: string; variant: BadgeProps["variant"] }) => {
  return (
    <ChakraBadge variant={variant} fontWeight="semibold">
      {icon && icon}
      {text}
    </ChakraBadge>
  )
}
