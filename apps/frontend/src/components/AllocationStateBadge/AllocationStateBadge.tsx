import { useAllocationsRoundState } from "@/api"
import { HStack, Icon, Skeleton, StackProps, Text, TextProps } from "@chakra-ui/react"
import { ReactNode } from "react"
import { DotSymbol } from "../DotSymbol"
import { FaThumbsUp } from "react-icons/fa6"

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
  const { data, isLoading, error } = useAllocationsRoundState(roundId)

  if (isLoading)
    return (
      <Skeleton>
        <Badge
          text="loading"
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
        text="Error getting state"
        icon={renderIcon ? <DotSymbol size={4} color={"#D23F63"} /> : undefined}
      />
    )

  if (data === 0)
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
        text="Active now"
        icon={renderIcon ? <DotSymbol pulse size={2} color={"#3A6F00"} /> : undefined}
      />
    )
  if ([1, 2].includes(data))
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
        text="Concluded"
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
    <HStack spacing={2} align="center" rounded={"full"} py={2} px={4} {...containerProps}>
      {icon}
      <Text fontSize="sm" color="gray.500" fontWeight={600} {...textProps}>
        {text}
      </Text>
    </HStack>
  )
}
