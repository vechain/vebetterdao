import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { ReactElement } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  votes: number
  text: string
  percentage: number
  color: string
  icon: ReactElement
}
export const ProposalVotesProgressBar = ({ text, votes, percentage, color, icon }: Props) => {
  const { t } = useTranslation()
  return (
    <VStack alignItems={"stretch"}>
      <HStack justify={"space-between"}>
        <HStack>
          {icon}
          <Text color={color}>{text}</Text>
        </HStack>
        <HStack alignItems={"baseline"} gap={1}>
          <Text color={color} fontWeight={600}>
            {votes}
          </Text>
          <Text color={color} fontSize="12px">
            {t("({{percentage}}%)", { percentage })}
          </Text>
        </HStack>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="8px" rounded="full" />
        <Box bg={color} h="8px" rounded="full" w={`${percentage}%`} position="absolute" top={0} left={0} />
      </Box>
    </VStack>
  )
}
