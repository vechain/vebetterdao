import { useAllocationAmount, useAllocationsRound, useMostVotedAppsInRound } from "@/api"
import {
  Box,
  Card,
  HStack,
  Heading,
  Icon,
  LinkBox,
  LinkOverlay,
  Link,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FaAngleRight } from "react-icons/fa6"
import { DotSymbol } from "@/components/DotSymbol"
import { useMemo } from "react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { AllocationStateBadge } from "@/components/AllocationStateBadge"
import { useTranslation } from "react-i18next"
import { B3TRIcon } from "@/components/Icons"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"

type Props = {
  roundId: string
}

const compactFormatter = getCompactFormatter()

export const AllocationRoundCard: React.FC<Props> = ({ roundId }) => {
  const { t } = useTranslation()

  const { data: allocationRound, isLoading } = useAllocationsRound(roundId)
  const { data: roundAmount, isLoading: roundAmountLoading, error: roundAmountError } = useAllocationAmount(roundId)

  const totalAmount = useMemo(() => {
    if (!roundAmount) return 0
    return Object.values(roundAmount).reduce((acc, amount) => acc + Number(amount), 0)
  }, [roundAmount])

  const isActive = useMemo(() => {
    return allocationRound?.state === 0 && allocationRound?.voteEndTimestamp?.isAfter()
  }, [allocationRound])

  const mostVotedAppsQuery = useMostVotedAppsInRound(roundId)

  return (
    <LinkBox asChild>
      <Card.Root
        w="full"
        bg={isActive ? "success.subtle" : "bg.primary"}
        fill="icon.default"
        boxShadow={isActive ? "0 0 5px 0 rgba(56, 191, 102, 0.40)" : "none"}
        borderWidth={"1px"}
        borderColor={isActive ? "success.secondary" : "border.primary"}
        rounded="3xl"
        transition="all 0.2s ease-in-out"
        data-testid={`round-card-#${roundId}`}>
        <Card.Body p={4}>
          <HStack justify={"space-between"} w="full">
            <Stack w="full" gap={1} flex={2}>
              <HStack gap={2} w="fit-content" justify="space-between">
                <AllocationStateBadge
                  roundId={roundId}
                  data-testid={`round-card-#${roundId}`}
                  renderBadge={false}
                  renderIcon={isActive}
                />

                <DotSymbol
                  boxProps={{ hideBelow: "md" }}
                  color={isActive ? "text.default" : "text.subtle"}
                  size={"4px"}
                />
                <Skeleton hideBelow="md" loading={isLoading}>
                  <Text color={isActive ? "text.default" : "text.subtle"} textStyle="xs">
                    {isActive
                      ? t("ends {{value}}", { value: allocationRound.voteEndTimestamp?.fromNow() })
                      : allocationRound.voteEndTimestamp?.fromNow()}
                  </Text>
                </Skeleton>
              </HStack>

              <HStack mt={0.5} w="full" justify="space-between">
                <LinkOverlay w="full" flex={1}>
                  <Link href={`rounds/${roundId}`}>
                    <Heading as="h3" size="xl" fontWeight="semibold">
                      {t("Round #{{round}}", {
                        round: roundId,
                      })}
                    </Heading>
                  </Link>
                </LinkOverlay>
              </HStack>
              <HStack w="fit-content" justify="space-between" textStyle="xs" fontWeight={400}>
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
                      <VStack gap={0} alignItems="flex-end">
                        <HStack gap={1}>
                          <Heading size="xl">{compactFormatter.format(Number(totalAmount))}</Heading>
                          <B3TRIcon boxSize={"20px"} colorVariant="dark" />
                        </HStack>
                        <Text textStyle={"xs"} color="text.subtle">
                          {t("total allocation")}
                        </Text>
                      </VStack>
                    )}
                  </Skeleton>
                </Box>

                <OverlappedAppsImages
                  appsIds={mostVotedAppsQuery.data.map(a => a.id)}
                  isLoading={mostVotedAppsQuery.isLoading}
                  otherAppsActiveColor={isActive}
                />
              </Stack>
              <Icon as={FaAngleRight} boxSize={"24px"} fill="inherit" data-testid={`round-link-#${roundId}`} />
            </HStack>
          </HStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
