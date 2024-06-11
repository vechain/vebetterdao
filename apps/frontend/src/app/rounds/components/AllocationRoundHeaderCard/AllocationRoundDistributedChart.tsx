import { useMaxAllocationAmount, useAllocationAmount, useAllocationBaseAmount } from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import { VStack, HStack, Heading, useColorModeValue, Text, Box, CardBody, Card, Icon } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MdHowToVote } from "react-icons/md"

const compactFormatter = getCompactFormatter(2)

type Props = {
  roundId: string
}
export const AllocationRoundDistributedChart = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const {
    data: maxDAppAllocation,
    isLoading: maxDAppAllocationLoading,
    error: maxDAppAllocationError,
  } = useMaxAllocationAmount(roundId)

  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)
  const { data: baseAmount, isLoading: baseAmountLoading, error: baseAmountError } = useAllocationBaseAmount(roundId)

  const baseAmountPercentage = useMemo(() => {
    //TODO: take int oaccount number of apps
    return (Number(baseAmount) / Number(roundAmount?.voteXAllocations)) * 100
  }, [baseAmount, roundAmount])

  const baseAmountColor = useColorModeValue("#203A87", "#203A87")
  const rewardsAmountColor = useColorModeValue("#5FA5F9", "#5FA5F9")

  return (
    <Card variant="filled" w="full" flex={1}>
      <CardBody as={VStack} justify={"space-between"}>
        <Box w="full">
          <HStack spacing={2} align="center">
            <B3TRIcon boxSize="40px" colorVariant="dark" />
            <Heading size="xl">{compactFormatter.format(Number(roundAmount?.voteXAllocations))}</Heading>
          </HStack>
          <Text fontSize="md" color="#6A6A6A">
            {t("B3TR to distribute between apps")}
          </Text>
        </Box>

        <VStack spacing={2} color={"#6194F5"} w="full">
          <HStack w="full" justify={"space-between"}>
            <HStack spacing={1} align="center">
              <Icon as={MdHowToVote} boxSize={6} />
              <Text fontSize="md">{t("To be distributed")}</Text>
            </HStack>
            <HStack spacing={1} align="center">
              <Text fontSize="md" fontWeight={600}>
                7200 B3TR
              </Text>
              <Text fontSize="md">(60%)</Text>
            </HStack>
          </HStack>
          <Box position="relative" w="full">
            <Box bg="#D5D5D5" h="8px" rounded="full" />
            <Box
              bg={baseAmountColor}
              h="8px"
              rounded="full"
              w={`${baseAmountPercentage}%`}
              position="absolute"
              top={0}
              left={0}
            />
          </Box>
        </VStack>
        <VStack w="full" spacing={6}>
          <HStack w="full" spacing={1} color="#252525">
            <DotSymbol size={4} color={baseAmountColor} />
            <Text ml={1} fontSize="md" fontWeight={600}>
              2400 B3
            </Text>
            <Text fontSize="md">(20%) base allocation</Text>
          </HStack>
          <HStack w="full" spacing={1} color="#252525">
            <DotSymbol size={4} color={rewardsAmountColor} />
            <Text ml={1} fontSize="md" fontWeight={600}>
              2400 B3
            </Text>
            <Text fontSize="md">(20%) to distribute as rewards</Text>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
