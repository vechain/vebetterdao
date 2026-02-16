"use client"
import { Badge, Button, Card, Heading, HStack, LinkBox, LinkOverlay, Skeleton, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FiAlertCircle } from "react-icons/fi"

import { EmptyState } from "@/components/ui/empty-state"

import { useTreasuryExecutedProposals } from "../hooks/useTreasuryExecutedProposals"

const PAGE_SIZE = 2

export const TreasuryExecutedProposals = () => {
  const { t } = useTranslation()
  const { executedProposals, isLoading } = useTreasuryExecutedProposals()
  const [visible, setVisible] = useState(PAGE_SIZE)

  const displayed = executedProposals.slice(0, visible)
  const hasMore = visible < executedProposals.length

  return (
    <Card.Root w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading size="lg" fontWeight="bold">
            {t("Executed Proposals")}
          </Heading>

          <Skeleton loading={isLoading} rounded="md">
            {displayed.length > 0 ? (
              <VStack gap={3} align="stretch">
                {displayed.map(proposal => (
                  <LinkBox key={proposal.id}>
                    <Card.Root
                      variant="outline"
                      size="sm"
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ borderColor: "border.emphasized", bg: "bg.subtle" }}>
                      <Card.Body py={3} px={4}>
                        <VStack align="stretch" gap={2}>
                          <LinkOverlay asChild>
                            <NextLink href={`/proposals/${proposal.id}`}>
                              <Text fontWeight="semibold" textStyle="sm">
                                {proposal.title}
                              </Text>
                            </NextLink>
                          </LinkOverlay>
                          <HStack justify="space-between" gap={2} flexWrap="wrap">
                            <Badge size="sm" colorPalette="green">
                              {proposal.transferAmount} {proposal.transferToken}
                            </Badge>
                            <Text textStyle="xs" color="text.muted">
                              {t("Round")} {proposal.roundId}
                              {" · "}
                              {proposal.date}
                            </Text>
                          </HStack>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  </LinkBox>
                ))}
                {hasMore && (
                  <Button variant="outline" size="sm" onClick={() => setVisible(v => v + PAGE_SIZE)} mx="auto">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            ) : (
              <EmptyState
                bg="transparent"
                size="sm"
                title={t("No executed proposals found")}
                icon={<FiAlertCircle />}
              />
            )}
          </Skeleton>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
