import { useAllocationsRoundState } from "@/api"
import { HStack, Icon, Skeleton, StackProps, Text, TextProps } from "@chakra-ui/react"
import { ReactNode } from "react"
import { DotSymbol } from "../DotSymbol"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"

type Props = {
  roundId: string
}
export const AllocationStateBadge = ({ roundId }: Props) => {
  const { data, isLoading, error } = useAllocationsRoundState(roundId)

  if (isLoading)
    return (
      <Skeleton>
        <Badge text="loading" />
      </Skeleton>
    )
  if (error)
    return (
      <Badge
        textProps={{
          color: "#D23F63",
        }}
        containerProps={{
          bgColor: "#F8F8F8",
        }}
        text="Error getting state"
        icon={<DotSymbol size={4} color={"#D23F63"} />}
      />
    )

  if (data === 0)
    return (
      <Badge
        textProps={{
          color: "#3A6F00",
        }}
        containerProps={{
          bgColor: "#CDFF9F",
        }}
        text="Active now"
        icon={<DotSymbol size={2} color={"#3A6F00"} />}
      />
    )
  if (data === 1)
    return (
      <Badge
        textProps={{
          color: "#D23F63",
        }}
        containerProps={{
          bgColor: "#F8F8F8",
        }}
        text="Ended and rejected"
        icon={<Icon as={FaThumbsDown} boxSize={4} color={"#D23F63"} />}
      />
    )
  if (data === 2)
    return (
      <Badge
        textProps={{
          color: "#004CFC",
        }}
        containerProps={{
          bgColor: "#EBF1FE",
        }}
        text="Ended and queued"
        icon={<Icon as={FaThumbsUp} boxSize={4} color={"#004CFC"} />}
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
