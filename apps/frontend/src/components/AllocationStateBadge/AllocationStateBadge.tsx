import { useAllocationsRound, useAllocationsRoundState } from "@/api"
import { HStack, Icon, Skeleton, StackProps, Text, TextProps } from "@chakra-ui/react"
import { ReactNode, useMemo } from "react"
import { DotSymbol } from "../DotSymbol"
import { FaThumbsUp } from "react-icons/fa6"
import { useTranslation } from "react-i18next"

type Props = {
  roundId: string
  renderIcon?: boolean
  renderBadge?: boolean
  textProps?: TextProps
  containerProps?: StackProps
}
export const AllocationStateBadge = ({
  roundId,
  renderBadge = true,
  renderIcon = true,
  textProps = {},
  containerProps = {},
}: Props) => {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAllocationsRoundState(roundId)
  const { data: allocationRound } = useAllocationsRound(roundId)
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  if (isLoading)
    return (
      <Skeleton>
        <Badge
          text={t("loading")}
          containerProps={
            renderBadge
              ? {
                  bgColor: "#F8F8F8",
                  ...containerProps,
                }
              : {
                  px: 0,
                  py: 0,
                  ...containerProps,
                }
          }
          icon={renderIcon ? <DotSymbol size={4} color={"#D23F63"} /> : undefined}
        />
      </Skeleton>
    )
  if (error || data === undefined)
    return (
      <Badge
        textProps={{
          color: "#D23F63",
          ...textProps,
        }}
        containerProps={
          renderBadge
            ? {
                bgColor: "#F8F8F8",
                ...containerProps,
              }
            : {
                px: 0,
                py: 0,
                ...containerProps,
              }
        }
        text={t("Error getting state")}
        icon={renderIcon ? <DotSymbol size={4} color={"#D23F63"} /> : undefined}
      />
    )

  if (isActive)
    return (
      <Badge
        textProps={{
          color: "#3A6F00",
          ...textProps,
        }}
        containerProps={
          renderBadge
            ? {
                bgColor: "#CDFF9F",
                ...containerProps,
              }
            : {
                px: 0,
                py: 0,
                ...containerProps,
              }
        }
        text={t("Active now")}
        icon={renderIcon ? <DotSymbol pulse size={2} color={"#3A6F00"} /> : undefined}
      />
    )
  if (!isActive)
    return (
      <Badge
        textProps={{
          color: "#004CFC",
          ...textProps,
        }}
        containerProps={
          renderBadge
            ? {
                bgColor: "#EBF1FE",
                ...containerProps,
              }
            : {
                px: 0,
                py: 0,
                ...containerProps,
              }
        }
        text={t("Concluded")}
        icon={renderIcon ? <Icon as={FaThumbsUp} boxSize={4} color={"#004CFC"} /> : undefined}
      />
    )
}

type BadgeProps = {
  containerProps?: StackProps
  icon?: ReactNode
  text: string
  textProps?: TextProps
}

export const Badge = ({ containerProps, icon, text, textProps }: BadgeProps) => {
  return (
    <HStack gap={2} align="center" rounded={"full"} py={2} px={4} {...containerProps}>
      {icon}
      <Text textStyle="sm" color="gray.500" fontWeight={600} {...textProps} data-testid={`round-status`}>
        {text}
      </Text>
    </HStack>
  )
}
