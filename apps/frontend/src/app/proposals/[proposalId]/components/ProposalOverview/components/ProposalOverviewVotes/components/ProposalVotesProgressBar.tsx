import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ReactElement } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  text: string
  percentage: number
  voters: number
  color: string
  icon: ReactElement
  isLoading?: boolean
}

const compactFormatter = getCompactFormatter(1)

export const ProposalVotesProgressBar = ({ isLoading, text, percentage, voters, color, icon }: Props) => {
  const { t } = useTranslation()
  return (
    <VStack alignItems={"stretch"}>
      <HStack justify={"space-between"}>
        <HStack>
          {icon}
          <Text color={color}>{text}</Text>
        </HStack>
        <HStack alignItems={"baseline"} gap={1}>
          <Skeleton loading={isLoading}>
            <Text color={color} textStyle="sm">
              {t("{{percentage}}%", {
                percentage: compactFormatter.format(Number(percentage)),
              })}
              {voters
                ? `(${t("{{value}} votes", {
                    value: compactFormatter.format(Number(voters)),
                  })})`
                : null}
            </Text>
          </Skeleton>
        </HStack>
      </HStack>
      <Skeleton loading={isLoading} position="relative" h="8px" rounded="full" overflow={"hidden"}>
        <Box bg="#D5D5D5" h="full" />
        <Box overflow={"hidden"} bg={color} h="full" w={`${percentage}%`} position="absolute" top={0} left={0} />
      </Skeleton>
    </VStack>
  )
}
