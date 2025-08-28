import { useAllocationAmount, useAllocationsRound, useMostVotedAppsInRound } from "@/api"
import { Box, Card, HStack, Heading, Icon, Skeleton, Stack, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { AllocationStateBadge } from "@/components/AllocationStateBadge"
import { useTranslation } from "react-i18next"
import { B3TRIcon } from "@/components/Icons"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import { useTheme } from "next-themes"

type Props = {
  roundId: string
}

const compactFormatter = getCompactFormatter()

export const AllocationRoundCard: React.FC<Props> = ({ roundId }) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { theme } = useTheme()

  const { data: allocationRound, isLoading } = useAllocationsRound(roundId)
  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return Object.values(roundAmount).reduce((acc, amount) => acc + Number(amount), 0)
  }, [roundAmount])

  const onRoundClick = () => {
    router.push(`/rounds/${roundId}`)
  }
  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  const cardActiveBackgroundColor = "#E9FDF1"
  const cardActiveBorderColor = "#3DBA67"

  const cardTextColor = isActive ? "black" : "inherit"

  //TODO: dark mode support
  const nonActiveBackgroundColor = theme === "light" ? "rgba(166, 217, 110, 0.12)" : "rgba(166, 217, 110, 0.12)"

  const mostVotedAppsQuery = useMostVotedAppsInRound(roundId)

  return (
    <Card.Root
      variant={"baseWithBorder"}
      borderRadius={"24px"}
      w="full"
      {...(isActive && {
        bg: cardActiveBackgroundColor,
        borderColor: cardActiveBorderColor,
        borderWidth: "1px",
      })}
      onClick={onRoundClick}
      _hover={{
        bg: isActive ? cardActiveBackgroundColor : nonActiveBackgroundColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}
      data-testid={`round-card-#${roundId}`}>
      <Card.Body py="20px">
        <HStack justify={"space-between"} w="full">
          <Stack w="full" gap={1} flex={2}>
            <HStack gap={2} w="fit-content" justify="space-between">
              <AllocationStateBadge
                roundId={roundId}
                data-testid={`round-card-#${roundId}`}
                renderBadge={false}
                renderIcon={isActive}
              />

              <DotSymbol boxProps={{ hideBelow: "md" }} color={"#6A6A6A"} size={"4px"} />
              <Skeleton hideBelow="md" loading={isLoading}>
                <Text fontWeight={400} color={"#6A6A6A"} fontSize={"14px"}>
                  {isActive
                    ? t("ends {{value}}", { value: allocationRound.voteEndTimestamp?.fromNow() })
                    : allocationRound.voteEndTimestamp?.fromNow()}
                </Text>
              </Skeleton>
            </HStack>

            <HStack mt={0.5} w="full" justify="space-between" color={cardTextColor}>
              <Heading as="h3" size="xl">
                {t("Round #{{round}}", {
                  round: roundId,
                })}
              </Heading>
            </HStack>
            <HStack w="fit-content" justify="space-between" fontSize={"12px"} fontWeight={400} color={cardTextColor}>
              <Skeleton loading={isLoading}>
                <Text>
                  {allocationRound.voteStartTimestamp?.format("MMM D")} {" - "}
                  {allocationRound.voteEndTimestamp?.format("MMM D")}
                </Text>
              </Skeleton>
            </HStack>
          </Stack>
          <HStack gap={4} justify="flex-end" flex={1}>
            <Stack direction={["column", "column", "row"]} gap={4} align={["flex-end", "flex-end", "center"]}>
              <Box width={"max-content"} justifyContent={"end"}>
                <Skeleton loading={roundAmountLoading}>
                  {roundAmountError ? (
                    <Text color="red.500">{roundAmountError.message}</Text>
                  ) : (
                    <Box textAlign={"end"} color={cardTextColor}>
                      <HStack gap={1}>
                        <Heading size="2xl">{compactFormatter.format(Number(totalAmount))}</Heading>
                        <B3TRIcon boxSize={"20px"} colorVariant="dark" />
                      </HStack>
                      <Text fontSize={"14px"} fontWeight={400}>
                        {t("total allocation")}
                      </Text>
                    </Box>
                  )}
                </Skeleton>
              </Box>

              <OverlappedAppsImages
                appsIds={mostVotedAppsQuery.data.map(a => a.id)}
                isLoading={mostVotedAppsQuery.isLoading}
                otherAppsActiveColor={isActive}
              />
            </Stack>
            <Icon as={FaAngleRight} boxSize={"24px"} color={cardTextColor} data-testid={`round-link-#${roundId}`} />
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
